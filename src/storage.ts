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

export function saveData(data: AppData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* Private browsing can reject storage. */ }
}
