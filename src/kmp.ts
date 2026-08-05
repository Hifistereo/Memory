/* Typed access to the shared KidMindPath profile (public/shared/kmp.js).
 *
 * Every function here is null-safe on purpose. This app is also served from
 * hifistereo.github.io/Memory/, a different origin where window.KMP does not
 * exist at all, and it has to keep working exactly as it did before the hub
 * existed. Nothing in this file may throw or assume the hub is present. */

export interface KmpChild {
  id: string;
  name: string;
  ageYears: number | null;
  avatar: string;
  guest: boolean;
}

export interface KmpPrefs {
  sound: boolean;
  reducedMotion: boolean;
}

interface KmpApi {
  activeChild(): KmpChild;
  prefs(): KmpPrefs;
  savePrefs(next: KmpPrefs): boolean;
  ageBand(scheme: string): string | number | null;
  noteVisit(appId: string): void;
  homeBar(opts: { appId?: string; title?: string; home?: string; onLeave?: () => void }): unknown;
}

const api = (): KmpApi | null => {
  const k = (window as unknown as { KMP?: KmpApi }).KMP;
  return k && typeof k.activeChild === 'function' ? k : null;
};

/** The child chosen on the hub, or null when opened outside kidmindpath.com. */
export function activeChild(): KmpChild | null {
  try { return api()?.activeChild() ?? null; } catch { return null; }
}

/** Global sound / reduced motion, or null to mean "use this app's own setting". */
export function prefs(): KmpPrefs | null {
  try { return api()?.prefs() ?? null; } catch { return null; }
}

/** The shared age mapped onto this app's own bands, or null if unknown. */
export function ageBand(): '2-3' | '4-5' | '5-6' | null {
  try {
    const band = api()?.ageBand('memory');
    return band === '2-3' || band === '4-5' || band === '5-6' ? band : null;
  } catch {
    return null;
  }
}

/** Write the shared prefs. Returns false when there is no hub to write to. */
export function setPrefs(next: KmpPrefs): boolean {
  try {
    const ok = api()?.savePrefs(next) ?? false;
    // kmp.js is plain storage with no change events, so nudge React itself.
    if (ok) window.dispatchEvent(new Event('kmp:prefs'));
    return ok;
  } catch {
    return false;
  }
}

export function homeBar(opts: { title?: string; onLeave?: () => void }): void {
  try { api()?.homeBar({ appId: 'Memory', ...opts }); } catch { /* bar is optional chrome */ }
}
