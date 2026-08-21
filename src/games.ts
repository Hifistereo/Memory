import type { GameContract, GameId, GameMeta, GameProgress, GameRound } from './types'

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const shuffled = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

export const numberWords = ['nulle', 'viens', 'divi', 'trīs', 'četri', 'pieci', 'seši', 'septiņi', 'astoņi', 'deviņi', 'desmit']

type Gender = 'm' | 'f'
type GrammaticalCase = 'nom' | 'acc'

// [nominative, accusative] per gender, for the 0-10 range this game uses.
const CARDINALS: Record<number, Record<Gender, [string, string]>> = {
  0: { m: ['nulle', 'nulle'], f: ['nulle', 'nulle'] },
  1: { m: ['viens', 'vienu'], f: ['viena', 'vienu'] },
  2: { m: ['divi', 'divus'], f: ['divas', 'divas'] },
  3: { m: ['trīs', 'trīs'], f: ['trīs', 'trīs'] },
  4: { m: ['četri', 'četrus'], f: ['četras', 'četras'] },
  5: { m: ['pieci', 'piecus'], f: ['piecas', 'piecas'] },
  6: { m: ['seši', 'sešus'], f: ['sešas', 'sešas'] },
  7: { m: ['septiņi', 'septiņus'], f: ['septiņas', 'septiņas'] },
  8: { m: ['astoņi', 'astoņus'], f: ['astoņas', 'astoņas'] },
  9: { m: ['deviņi', 'deviņus'], f: ['deviņas', 'deviņas'] },
  10: { m: ['desmit', 'desmit'], f: ['desmit', 'desmit'] },
}

export function numberWord(value: number, gender: Gender = 'm', grammaticalCase: GrammaticalCase = 'nom'): string {
  const entry = CARDINALS[value]
  if (!entry) return String(value)
  return entry[gender][grammaticalCase === 'acc' ? 1 : 0]
}

export function latvianNumber(value: number): string {
  return numberWord(value, 'm', 'nom')
}

// "viens punkts" (singular) vs "divi punkti" / "trīs punkti" (plural) - used for
// the dots game's memory prompt and its wrong-answer explanation.
export function pointsPhrase(quantity: number): string {
  return `${numberWord(quantity, 'm', 'nom')} ${quantity === 1 ? 'punkts' : 'punkti'}`
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
    description: 'Atrodi, kur ir vairāk, un palīdzi pūķim uzvarēt.', ageBands: ['4-5', '5-6'], ageLabel: '4–6 gadi',
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
  return { kind: 'dots', quantity, choices: numericChoices(quantity, 1, 3, level === 1 ? 2 : 3), prompt: 'Atceries punktiņus!', speech: `Atceries: ${pointsPhrase(quantity)}.` }
}

const objects = [
  { one: 'ābolu', many: 'ābolus', icon: 'apple', gender: 'm' as const },
  { one: 'bumbieri', many: 'bumbierus', icon: 'pear', gender: 'm' as const },
  { one: 'zīli', many: 'zīles', icon: 'acorn', gender: 'f' as const },
]

function createCountRound(level: number): GameRound {
  const max = level <= 1 ? 5 : level === 2 ? 6 : 8
  const target = randomInt(1, max)
  const object = objects[randomInt(0, objects.length - 1)]
  const noun = target === 1 ? object.one : object.many
  const word = numberWord(target, object.gender, 'acc')
  return { kind: 'count', target, object, choices: numericChoices(target, 1, max), prompt: `Ieliec grozā ${word} ${noun}!`, speech: `Ieliec grozā ${word} ${noun}.` }
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
    return { kind: 'path', target, max, prompt: `Atrodi skaitli ${latvianNumber(target)}!`, speech: `Atrodi skaitli ${latvianNumber(target)}.` }
  }
  const operation = Math.random() > .5 ? 'plus' : 'minus'
  const start = operation === 'plus' ? randomInt(1, max - 1) : randomInt(2, max)
  const target = operation === 'plus' ? start + 1 : start - 1
  const direction = operation === 'plus' ? 'vienu uz priekšu' : 'vienu atpakaļ'
  const phrase = `Sāc pie skaitļa ${latvianNumber(start)} un lec ${direction}`
  return { kind: 'path', target, max, start, operation, prompt: `${phrase}!`, speech: `${phrase}.` }
}

const marketItems = [
  { nameOne: 'ābolu', namePl: 'ābolus', icon: 'apple', gender: 'm' as const },
  { nameOne: 'bumbieri', namePl: 'bumbierus', icon: 'pear', gender: 'm' as const },
  { nameOne: 'burkānu', namePl: 'burkānus', icon: 'carrot', gender: 'm' as const },
  { nameOne: 'zemeni', namePl: 'zemenes', icon: 'berry', gender: 'f' as const },
]

function phraseForItem(item: { nameOne: string; namePl: string; gender: Gender; count: number }): string {
  const noun = item.count === 1 ? item.nameOne : item.namePl
  return `${numberWord(item.count, item.gender, 'acc')} ${noun}`
}

function createMarketRound(level: number): GameRound {
  const firstIndex = randomInt(0, marketItems.length - 1)
  const secondIndex = (firstIndex + randomInt(1, marketItems.length - 1)) % marketItems.length
  const max = level <= 1 ? 4 : 5
  const firstItem = { ...marketItems[firstIndex], count: randomInt(1, max) }
  const secondItem = level >= 2 ? { ...marketItems[secondIndex], count: randomInt(1, Math.min(4, max)) } : undefined
  const first = { name: firstItem.namePl, icon: firstItem.icon, count: firstItem.count }
  const second = secondItem ? { name: secondItem.namePl, icon: secondItem.icon, count: secondItem.count } : undefined
  const text = secondItem ? `${phraseForItem(firstItem)} un ${phraseForItem(secondItem)}` : phraseForItem(firstItem)
  return { kind: 'market', first, second, prompt: `Lūdzu, ${text}!`, speech: `Lūdzu, paņem ${text}.` }
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
