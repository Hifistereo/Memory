import type { AgeBand, AppData, GameId, GameProgress, Profile } from './types'

export const STORAGE_KEY = 'ciparu-darzs-data'
export const GAME_IDS: GameId[] = ['dots', 'count', 'bigger', 'path', 'market']

export function emptyProgress(): GameProgress {
  return { level: 1, attempts: 0, correct: 0, sessions: 0, stars: 0, recent: [], bestAccuracy: 0, totalResponseMs: 0, hintsUsed: 0 }
}

export function createProfile(nickname: string, avatar: string, ageBand: AgeBand): Profile {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    nickname: nickname.trim().slice(0, 16) || 'Spēlētājs',
    avatar,
    ageBand,
    preferences: { sound: true, reducedMotion: false },
    progress: Object.fromEntries(GAME_IDS.map((id) => [id, emptyProgress()])) as Record<GameId, GameProgress>,
    createdAt: new Date().toISOString(),
  }
}

export function defaultData(): AppData {
  return { version: 1, selectedProfileId: null, profiles: [] }
}

export function migrateData(value: unknown): AppData {
  if (!value || typeof value !== 'object') return defaultData()
  const raw = value as Partial<AppData>
  if (!Array.isArray(raw.profiles)) return defaultData()
  const profiles = raw.profiles.slice(0, 4).map((item) => {
    const profile = item as Profile
    const progress = Object.fromEntries(GAME_IDS.map((id) => [id, { ...emptyProgress(), ...(profile.progress?.[id] ?? {}) }])) as Record<GameId, GameProgress>
    return {
      ...profile,
      nickname: String(profile.nickname || 'Spēlētājs').slice(0, 16),
      avatar: profile.avatar || 'lapsa',
      ageBand: (['2-3', '4-5', '5-6'].includes(profile.ageBand) ? profile.ageBand : '4-5') as AgeBand,
      preferences: { sound: profile.preferences?.sound !== false, reducedMotion: profile.preferences?.reducedMotion === true },
      linkedToHub: profile.linkedToHub === true,
      progress,
    }
  })
  return {
    version: 1,
    selectedProfileId: profiles.some((p) => p.id === raw.selectedProfileId) ? raw.selectedProfileId! : profiles[0]?.id ?? null,
    profiles,
  }
}

export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? migrateData(JSON.parse(stored)) : defaultData()
  } catch {
    return defaultData()
  }
}

/**
 * Follow the child chosen on kidmindpath.com.
 *
 * This app already stores per child, so what it needs is identity mapping, not
 * per-child storage keys: a profile whose id IS the hub's child id. Three
 * cases, in order:
 *
 *  1. A profile with that id exists — select it. The steady state.
 *  2. No hub child at all (opened from hifistereo.github.io, or nobody has
 *     been named yet) — change nothing and let this app's own picker run.
 *  3. First link on a device that has played before — adopt the currently
 *     selected profile by re-identifying it, so a child who has been playing
 *     keeps every star instead of appearing to start over. Done once, and only
 *     while no profile is already linked, so a second child can never absorb
 *     the first one's progress.
 */
export function syncWithHub(
  data: AppData,
  child: { id: string; name: string } | null,
  ageBand: AgeBand | null,
): AppData {
  if (!child) return data

  const mine = data.profiles.find((p) => p.id === child.id)
  if (mine) {
    const nickname = child.name?.trim().slice(0, 16) || mine.nickname
    if (nickname === mine.nickname && data.selectedProfileId === child.id) return data
    return {
      ...data,
      selectedProfileId: child.id,
      profiles: data.profiles.map((p) => (p.id === child.id ? { ...p, nickname, linkedToHub: true } : p)),
    }
  }

  const anyLinked = data.profiles.some((p) => p.linkedToHub)
  const adoptable = data.profiles.find((p) => p.id === data.selectedProfileId) ?? data.profiles[0]

  if (adoptable && !anyLinked) {
    const adopted: Profile = {
      ...adoptable,
      id: child.id,
      linkedToHub: true,
      nickname: child.name?.trim().slice(0, 16) || adoptable.nickname,
      ageBand: ageBand ?? adoptable.ageBand,
    }
    return {
      ...data,
      selectedProfileId: child.id,
      profiles: data.profiles.map((p) => (p.id === adoptable.id ? adopted : p)),
    }
  }

  const created: Profile = {
    ...createProfile(child.name || 'Spēlētājs', 'lapsa', ageBand ?? '4-5'),
    id: child.id,
    linkedToHub: true,
  }
  return { ...data, selectedProfileId: child.id, profiles: [...data.profiles, created].slice(0, 4) }
}

export function saveData(data: AppData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* Private browsing can reject storage. */ }
}
