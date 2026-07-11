import type { GameContract, GameId, GameMeta, GameProgress, GameRound } from './types'

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const shuffled = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

export const numberWords = ['nulle', 'viens', 'divi', 'trīs', 'četri', 'pieci', 'seši', 'septiņi', 'astoņi', 'deviņi', 'desmit']

export function latvianNumber(value: number): string {
  return numberWords[value] ?? String(value)
}

function numericChoices(answer: number, min: number, max: number, count = 3): number[] {
  const values = new Set([answer])
  let guard = 0
  while (values.size < Math.min(count, max - min + 1) && guard++ < 30) {
    const delta = randomInt(1, Math.max(1, max - min)) * (Math.random() > .5 ? 1 : -1)
    values.add(Math.min(max, Math.max(min, answer + delta)))
  }
  for (let n = min; values.size < count && n <= max; n++) values.add(n)
  return shuffled([...values])
}

export function adjustDifficulty(progress: GameProgress): number {
  const recent = progress.recent.slice(-8)
  if (recent.length < 6) return progress.level
  const accuracy = recent.filter(Boolean).length / recent.length
  if (accuracy >= .8) return Math.min(4, progress.level + 1)
  if (accuracy <= .5) return Math.max(1, progress.level - 1)
  return progress.level
}

export function recordAttempt(progress: GameProgress, correct: boolean, responseMs: number, hint = false): GameProgress {
  const attempts = progress.attempts + 1
  const correctCount = progress.correct + (correct ? 1 : 0)
  const recent = [...progress.recent, correct].slice(-12)
  const sessionAccuracy = correctCount / attempts
  const next = {
    ...progress,
    attempts,
    correct: correctCount,
    recent,
    totalResponseMs: progress.totalResponseMs + responseMs,
    hintsUsed: progress.hintsUsed + (hint ? 1 : 0),
    bestAccuracy: Math.max(progress.bestAccuracy, sessionAccuracy),
  }
  return { ...next, level: adjustDifficulty(next) }
}

const metadata: Record<GameId, GameMeta> = {
  dots: {
    id: 'dots', title: 'Mazo punktu pāri', shortTitle: 'Punktu pāri',
    description: 'Atceries mazo punktu pulciņu un atrodi tā pāri.', ageBands: ['2-3'], ageLabel: '2–3 gadi',
    skill: 'Daudzums 1–3 • īsā atmiņa', color: '#E8F4E6', accent: '#4D8D5A', icon: 'ladybird',
  },
  count: {
    id: 'count', title: 'Saskaiti un ieliec', shortTitle: 'Saskaiti',
    description: 'Salasi grozā tieši tik gardumu, cik palūgts.', ageBands: ['4-5'], ageLabel: '4–5 gadi',
    skill: 'Skaitīšana • daudzums', color: '#FFF0D8', accent: '#E57845', icon: 'basket',
  },
  bigger: {
    id: 'bigger', title: 'Lielākais uzvar', shortTitle: 'Lielākais',
    description: 'Atrodi, kur ir vairāk, un palīdzi pūķītim uzvarēt.', ageBands: ['4-5', '5-6'], ageLabel: '4–6 gadi',
    skill: 'Vairāk un mazāk • salīdzināšana', color: '#E4F3F7', accent: '#287E91', icon: 'dragon',
  },
  path: {
    id: 'path', title: 'Lēc pa skaitļu taku', shortTitle: 'Skaitļu taka',
    description: 'Atrodi īsto akmeni un lec uz priekšu pa skaitļiem.', ageBands: ['5-6'], ageLabel: '5–6 gadi',
    skill: 'Skaitļu rinda • plus un mīnus', color: '#EFE8FA', accent: '#7250A5', icon: 'frog',
  },
  market: {
    id: 'market', title: 'Atmiņas tirgus', shortTitle: 'Tirgus',
    description: 'Iegaumē pirkumu sarakstu un piepildi maisiņu.', ageBands: ['5-6'], ageLabel: '5–6 gadi',
    skill: 'Atmiņa • skaitīšana • saskaitīšana', color: '#FBE8E2', accent: '#B6534E', icon: 'market',
  },
}

function createDotRound(level: number): GameRound {
  const quantity = randomInt(1, level === 1 ? 2 : 3)
  return { kind: 'dots', quantity, choices: numericChoices(quantity, 1, 3, level === 1 ? 2 : 3), prompt: 'Atceries punktiņus!', speech: `Atceries: ${latvianNumber(quantity)} punkti.` }
}

const objects = [
  { one: 'ābolu', many: 'ābolus', icon: 'apple' },
  { one: 'bumbieri', many: 'bumbierus', icon: 'pear' },
  { one: 'zīli', many: 'zīles', icon: 'acorn' },
]

function createCountRound(level: number): GameRound {
  const max = level <= 1 ? 5 : level === 2 ? 6 : 8
  const target = randomInt(1, max)
  const object = objects[randomInt(0, objects.length - 1)]
  const noun = target === 1 ? object.one : object.many
  return { kind: 'count', target, object: object.icon, choices: numericChoices(target, 1, max), prompt: `Ieliec grozā ${target} ${noun}!`, speech: `Ieliec grozā ${latvianNumber(target)} ${noun}.` }
}

function sumFor(value: number): [number, number] {
  const first = randomInt(1, Math.max(1, value - 1))
  return [first, value - first]
}

function createBiggerRound(level: number): GameRound {
  const max = level === 1 ? 5 : level === 2 ? 8 : 10
  const left = randomInt(1, max)
  const distance = randomInt(1, max - 1)
  const right = ((left - 1 + distance) % max) + 1
  const modes: Array<'dots' | 'number' | 'sum'> = level === 1 ? ['dots'] : level === 2 ? ['dots', 'number'] : ['dots', 'number', 'sum']
  const leftMode = modes[randomInt(0, modes.length - 1)]
  const rightMode = modes[randomInt(0, modes.length - 1)]
  return {
    kind: 'bigger', left, right, leftMode, rightMode,
    leftSum: leftMode === 'sum' ? sumFor(left) : undefined,
    rightSum: rightMode === 'sum' ? sumFor(right) : undefined,
    prompt: 'Kur ir vairāk?', speech: 'Kur ir vairāk? Pieskaries lielākajam daudzumam.',
  }
}

function createPathRound(level: number): GameRound {
  const max = level === 1 ? 5 : 10
  if (level === 1) {
    const target = randomInt(1, max)
    return { kind: 'path', target, max, prompt: `Atrodi skaitli ${target}!`, speech: `Atrodi skaitli ${latvianNumber(target)}.` }
  }
  const operation = Math.random() > .5 ? 'plus' : 'minus'
  const start = operation === 'plus' ? randomInt(1, max - 1) : randomInt(2, max)
  const target = operation === 'plus' ? start + 1 : start - 1
  const word = operation === 'plus' ? 'vienu uz priekšu' : 'vienu atpakaļ'
  return { kind: 'path', target, max, start, operation, prompt: `No ${start} lec ${word}!`, speech: `No ${latvianNumber(start)} lec ${word}.` }
}

const marketItems = [
  { name: 'ābolus', icon: 'apple' }, { name: 'bumbierus', icon: 'pear' }, { name: 'burkānus', icon: 'carrot' }, { name: 'zemenes', icon: 'berry' },
]

function createMarketRound(level: number): GameRound {
  const firstIndex = randomInt(0, marketItems.length - 1)
  const secondIndex = (firstIndex + randomInt(1, marketItems.length - 1)) % marketItems.length
  const max = level <= 1 ? 4 : 5
  const first = { ...marketItems[firstIndex], count: randomInt(1, max) }
  const second = level >= 2 ? { ...marketItems[secondIndex], count: randomInt(1, Math.min(4, max)) } : undefined
  const text = second ? `${first.count} ${first.name} un ${second.count} ${second.name}` : `${first.count} ${first.name}`
  const spoken = second ? `${latvianNumber(first.count)} ${first.name} un ${latvianNumber(second.count)} ${second.name}` : `${latvianNumber(first.count)} ${first.name}`
  return { kind: 'market', first, second, prompt: `Lūdzu, ${text}!`, speech: `Lūdzu, paņem ${spoken}.` }
}

function evaluate(round: GameRound, answer: unknown): boolean {
  if (round.kind === 'dots') return answer === round.quantity
  if (round.kind === 'count') return answer === round.target
  if (round.kind === 'bigger') return answer === (round.left > round.right ? 'left' : 'right')
  if (round.kind === 'path') return answer === round.target
  if (round.kind === 'market') {
    const counts = answer as Record<string, number>
    return counts?.[round.first.icon] === round.first.count && (!round.second || counts?.[round.second.icon] === round.second.count)
  }
  return false
}

export const games: Record<GameId, GameContract> = {
  dots: { meta: metadata.dots, sessionLength: 5, createRound: createDotRound, evaluate, adjustDifficulty },
  count: { meta: metadata.count, sessionLength: 6, createRound: createCountRound, evaluate, adjustDifficulty },
  bigger: { meta: metadata.bigger, sessionLength: 7, createRound: createBiggerRound, evaluate, adjustDifficulty },
  path: { meta: metadata.path, sessionLength: 6, createRound: createPathRound, evaluate, adjustDifficulty },
  market: { meta: metadata.market, sessionLength: 5, createRound: createMarketRound, evaluate, adjustDifficulty },
}

export const gameList = Object.values(games)
