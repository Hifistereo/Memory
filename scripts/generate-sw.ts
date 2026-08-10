// Generates a fully offline-capable service worker at build time.
//
// Vite hashes this app's bundled output (assets/[name]-[hash].js), so unlike
// the org's other apps (KidlaTest, ENG-learning) a hand-maintained precache
// list would go stale on every build. Instead this plugin runs on
// `closeBundle` — the last build hook, guaranteed to fire after Vite has
// finished writing dist/, including files copied verbatim from public/ (the
// design-system copy, the manifest, icons) which aren't part of the Rollup
// bundle graph and wouldn't be visible from an earlier hook such as
// `writeBundle` for an individual plugin.
//
// The emitted sw.js has its cache name and precache list baked directly into
// the file (not fetched separately at runtime): a browser decides whether a
// new service worker version exists by diffing the script's own bytes, so a
// separately-fetched manifest with a static sw.js would risk the browser
// never noticing a new build. Baking the list in means every build that
// changes any file also changes sw.js itself.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { Plugin } from 'vite';

const SW_FILENAME = 'sw.js';

function listFiles(dir: string, base: string = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory()
      ? listFiles(full, base)
      : [relative(base, full).split('\\').join('/')];
  });
}

function swTemplate(cacheName: string, precache: string[]): string {
  return `// GENERATED FILE — do not edit by hand.
// Produced by scripts/generate-sw.ts on every \`vite build\`. To change the
// caching logic, edit that file's swTemplate(), not this output.
const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener('install', (event) => {
  // Atomic: if any precached file 404s, install fails and the browser keeps
  // running the previous, fully-cached service worker version rather than
  // activating a partially-cached one.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Network-first so an online visit always gets the latest shell; the
    // cached copy is purely an offline fallback.
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Hashed/static assets: cache-first. A given hashed path's content never
  // changes, so there is nothing to revalidate against the network for it.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }))
  );
});
`;
}

export function generateServiceWorker(appId: string): Plugin {
  let outDir: string;
  return {
    name: 'generate-sw',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = listFiles(outDir)
        .filter((f) => f !== SW_FILENAME && !f.endsWith('.map'))
        .sort();

      const hash = createHash('sha256');
      for (const file of files) {
        hash.update(file);
        hash.update(readFileSync(join(outDir, file)));
      }
      const cacheName = `${appId}-${hash.digest('hex').slice(0, 10)}`;
      const precache = files.map((f) => `./${f}`);

      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, SW_FILENAME), swTemplate(cacheName, precache));
    },
  };
}
