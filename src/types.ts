export type AgeBand = '2-3' | '4-5' | '5-6'
export type GameId = 'dots' | 'count' | 'bigger' | 'path' | 'market'

export interface Preferences {
  sound: boolean
  reducedMotion: boolean
}

export interface GameProgress {
  level: number
  attempts: number
  correct: number
  sessions: number
  stars: number
  recent: boolean[]
  bestAccuracy: number
  totalResponseMs: number
  hintsUsed: number
}

export interface Profile {
  id: string
  /** True once this profile's id is the KidMindPath child id (see syncWithHub). */
  linkedToHub?: boolean
  nickname: string
  avatar: string
  ageBand: AgeBand
  preferences: Preferences
  progress: Record<GameId, GameProgress>
  createdAt: string
}

export interface AppData {
  version: 1
  selectedProfileId: string | null
  profiles: Profile[]
}

export interface GameMeta {
  id: GameId
  title: string
  shortTitle: string
  description: string
  ageBands: AgeBand[]
  ageLabel: string
  skill: string
  color: string
  accent: string
  icon: string
}

export type GameRound =
  | { kind: 'dots'; prompt: string; speech: string; quantity: number; choices: number[] }
  | { kind: 'count'; prompt: string; speech: string; target: number; object: string; choices: number[] }
  | { kind: 'bigger'; prompt: string; speech: string; left: number; right: number; leftMode: 'dots' | 'number' | 'sum'; rightMode: 'dots' | 'number' | 'sum'; leftSum?: [number, number]; rightSum?: [number, number] }
  | { kind: 'path'; prompt: string; speech: string; target: number; max: number; start?: number; operation?: 'plus' | 'minus' }
  | { kind: 'market'; prompt: string; speech: string; first: { name: string; icon: string; count: number }; second?: { name: string; icon: string; count: number } }

export interface GameContract {
  meta: GameMeta
  sessionLength: number
  createRound: (level: number, roundIndex: number) => GameRound
  evaluate: (round: GameRound, answer: unknown) => boolean
  adjustDifficulty: (progress: GameProgress) => number
}
