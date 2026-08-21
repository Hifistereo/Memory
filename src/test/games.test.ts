import { describe, expect, it, vi } from 'vitest'
import { adjustDifficulty, games, latvianNumber, numberWord, pointsPhrase, recordAttempt } from '../games'
import { emptyProgress } from '../storage'

describe('Latvian game engine', () => {
  it('uses correct Latvian number words', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(latvianNumber)).toEqual(['nulle', 'viens', 'divi', 'trīs', 'četri', 'pieci', 'desmit'])
  })

  it('declines numberWord by gender and case', () => {
    expect(numberWord(1, 'm', 'nom')).toBe('viens')
    expect(numberWord(1, 'f', 'acc')).toBe('vienu')
    expect(numberWord(2, 'm', 'acc')).toBe('divus')
    expect(numberWord(2, 'f', 'acc')).toBe('divas')
    expect(numberWord(4, 'm', 'acc')).toBe('četrus')
    expect(numberWord(4, 'f', 'acc')).toBe('četras')
    expect(numberWord(5, 'm', 'acc')).toBe('piecus')
    expect(numberWord(5, 'f', 'acc')).toBe('piecas')
    expect(numberWord(9, 'm', 'acc')).toBe('deviņus')
    expect(numberWord(9, 'f', 'acc')).toBe('deviņas')
    // 3 and 10 are invariant across gender/case in this game's register.
    expect(numberWord(3, 'm', 'acc')).toBe('trīs')
    expect(numberWord(3, 'f', 'acc')).toBe('trīs')
  })

  it('fixes the dots singular/plural noun ("punkts" vs "punkti")', () => {
    expect(pointsPhrase(1)).toBe('viens punkts')
    expect(pointsPhrase(2)).toBe('divi punkti')
    expect(pointsPhrase(3)).toBe('trīs punkti')
  })

  it('raises difficulty after sustained mastery', () => {
    expect(adjustDifficulty({ ...emptyProgress(), level: 2, recent: [true, true, true, true, true, true, false, true] })).toBe(3)
  })

  it('lowers difficulty after repeated difficulty', () => {
    expect(adjustDifficulty({ ...emptyProgress(), level: 3, recent: [false, false, true, false, true, false] })).toBe(2)
  })

  it('keeps a bounded recent history and records metrics', () => {
    let progress = emptyProgress()
    for (let i = 0; i < 15; i++) progress = recordAttempt(progress, i % 2 === 0, 1000)
    expect(progress.recent).toHaveLength(12)
    expect(progress.attempts).toBe(15)
    expect(progress.totalResponseMs).toBe(15000)
  })

  it('generates valid rounds at every level for every game', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.42)
    for (const game of Object.values(games)) {
      for (let level = 1; level <= 4; level++) {
        const round = game.createRound(level, 0)
        expect(round.prompt.length).toBeGreaterThan(3)
        expect(round.speech.length).toBeGreaterThan(3)
        if (round.kind === 'dots') expect(round.quantity).toBeGreaterThanOrEqual(1)
        if (round.kind === 'dots') expect(round.quantity).toBeLessThanOrEqual(3)
        if (round.kind === 'count') expect(round.target).toBeLessThanOrEqual(8)
        if (round.kind === 'bigger') expect(round.left).not.toBe(round.right)
        if (round.kind === 'path') expect(round.target).toBeLessThanOrEqual(round.max)
        if (round.kind === 'market') expect(round.first.count).toBeLessThanOrEqual(5)
      }
    }
    vi.restoreAllMocks()
  })

  it('evaluates correct answers for every game shape', () => {
    const apple = { icon: 'apple', gender: 'm' as const, one: 'ābolu', many: 'ābolus' }
    expect(games.dots.evaluate({ kind: 'dots', quantity: 2, choices: [1,2], prompt: '', speech: '' }, 2)).toBe(true)
    expect(games.count.evaluate({ kind: 'count', target: 4, object: apple, choices: [], prompt: '', speech: '' }, 4)).toBe(true)
    expect(games.bigger.evaluate({ kind: 'bigger', left: 5, right: 2, leftMode: 'number', rightMode: 'number', prompt: '', speech: '' }, 'left')).toBe(true)
    expect(games.path.evaluate({ kind: 'path', target: 7, max: 10, prompt: '', speech: '' }, 7)).toBe(true)
    expect(games.market.evaluate({ kind: 'market', first: { name: 'ābolus', icon: 'apple', count: 2 }, prompt: '', speech: '' }, { apple: 2 })).toBe(true)
  })

  it('writes count-round prompt and speech as matching, word-based, digit-free sentences', () => {
    const round = games.count.createRound(3, 0)
    if (round.kind !== 'count') throw new Error('expected a count round')
    const word = numberWord(round.target, round.object.gender, 'acc')
    const noun = round.target === 1 ? round.object.one : round.object.many
    expect(round.prompt).toBe(`Ieliec grozā ${word} ${noun}!`)
    expect(round.speech).toBe(`Ieliec grozā ${word} ${noun}.`)
    expect(round.prompt).not.toMatch(/\d/)
    expect(round.speech).not.toMatch(/\d/)
  })

  it('writes market-round prompt and speech as matching, word-based, digit-free sentences', () => {
    const round = games.market.createRound(3, 0)
    if (round.kind !== 'market') throw new Error('expected a market round')
    expect(round.prompt).toBe(`Lūdzu, ${round.speech.replace(/^Lūdzu, paņem /, '').replace(/\.$/, '!')}`)
    expect(round.prompt).not.toMatch(/\d/)
    expect(round.speech).not.toMatch(/\d/)
  })

  it('uses correctly declined singular nouns in Memory Market for count === 1', () => {
    // Fixed Math.random sequence pins createMarketRound's 3 calls (firstIndex,
    // secondIndex, count) at level 1: 0 -> apple (masc), then count -> 1.
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.5).mockReturnValueOnce(0)
    const masculine = games.market.createRound(1, 0)
    vi.restoreAllMocks()
    // 0.99 -> berry/zemene (fem, last item), then count -> 1.
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0.5).mockReturnValueOnce(0)
    const feminine = games.market.createRound(1, 0)
    vi.restoreAllMocks()

    if (masculine.kind !== 'market' || feminine.kind !== 'market') throw new Error('expected market rounds')
    expect(masculine.first.count).toBe(1)
    expect(masculine.prompt).toBe('Lūdzu, vienu ābolu!')
    expect(feminine.first.count).toBe(1)
    expect(feminine.prompt).toBe('Lūdzu, vienu zemeni!')
  })

  it('path round (level 1) shows the target as a word in both prompt and speech', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const round = games.path.createRound(1, 0)
    vi.restoreAllMocks()
    if (round.kind !== 'path') throw new Error('expected a path round')
    expect(round.prompt).toBe(`Atrodi skaitli ${latvianNumber(round.target)}!`)
    expect(round.speech).toBe(`Atrodi skaitli ${latvianNumber(round.target)}.`)
    expect(round.prompt).not.toMatch(/\d/)
  })

  it('path round (level >= 2) uses the natural "Sāc pie skaitļa ... un lec ..." template', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const round = games.path.createRound(2, 0)
    vi.restoreAllMocks()
    if (round.kind !== 'path' || round.start === undefined) throw new Error('expected a path round with a start value')
    const direction = round.operation === 'plus' ? 'vienu uz priekšu' : 'vienu atpakaļ'
    const phrase = `Sāc pie skaitļa ${latvianNumber(round.start)} un lec ${direction}`
    expect(round.prompt).toBe(`${phrase}!`)
    expect(round.speech).toBe(`${phrase}.`)
    expect(round.prompt).not.toMatch(/\d/)
  })
})
