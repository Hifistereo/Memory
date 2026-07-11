import { describe, expect, it, vi } from 'vitest'
import { adjustDifficulty, games, latvianNumber, recordAttempt } from '../games'
import { emptyProgress } from '../storage'

describe('Latvian game engine', () => {
  it('uses correct Latvian number words', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(latvianNumber)).toEqual(['nulle', 'viens', 'divi', 'trīs', 'četri', 'pieci', 'desmit'])
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
    expect(games.dots.evaluate({ kind: 'dots', quantity: 2, choices: [1,2], prompt: '', speech: '' }, 2)).toBe(true)
    expect(games.count.evaluate({ kind: 'count', target: 4, object: 'apple', choices: [], prompt: '', speech: '' }, 4)).toBe(true)
    expect(games.bigger.evaluate({ kind: 'bigger', left: 5, right: 2, leftMode: 'number', rightMode: 'number', prompt: '', speech: '' }, 'left')).toBe(true)
    expect(games.path.evaluate({ kind: 'path', target: 7, max: 10, prompt: '', speech: '' }, 7)).toBe(true)
    expect(games.market.evaluate({ kind: 'market', first: { name: 'ābolus', icon: 'apple', count: 2 }, prompt: '', speech: '' }, { apple: 2 })).toBe(true)
  })
})
