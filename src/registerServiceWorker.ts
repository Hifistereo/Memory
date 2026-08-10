// Registers the offline service worker generated at build time
// (scripts/generate-sw.mjs). A no-op when unsupported, or during
// `vite dev` where no built sw.js exists at this path — registration
// simply 404s and the rejection is swallowed.
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .catch((err) => console.warn('service worker registration failed', err));
  });
}
