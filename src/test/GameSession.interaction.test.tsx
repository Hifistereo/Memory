import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GameSession, { AUTO_ADVANCE_DELAY_MS } from '../GameSession'
import { games } from '../games'
import { createProfile } from '../storage'

class FakeUtterance {
  text: string
  constructor(text: string) { this.text = text }
}

function mockSpeech() {
  const speak = vi.fn()
  vi.stubGlobal('speechSynthesis', {
    cancel: vi.fn(),
    speak,
    getVoices: () => [],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  return speak
}

function spokenTexts(speak: ReturnType<typeof vi.fn>): string[] {
  return speak.mock.calls.map(([utterance]) => utterance.text)
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  // Unmount while the speechSynthesis stub is still in place (useSpeech's
  // cleanup effect reads window.speechSynthesis), then tear the stubs down.
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('correct-answer auto-advance', () => {
  it('shows no Continue button and auto-advances to the next round after a delay', () => {
    mockSpeech()
    vi.spyOn(games.dots, 'createRound').mockImplementation(() => ({
      kind: 'dots', quantity: 2, choices: [1, 2, 3],
      prompt: 'Atceries punktiņus!', speech: 'Atceries: divi punkti.',
    }))
    const profile = createProfile('Mia', 'lapsa', '2-3')
    const { container } = render(<GameSession gameId="dots" profile={profile} onExit={vi.fn()} onProgress={vi.fn()} />)

    act(() => { vi.advanceTimersByTime(1500) }) // reveal the answer choices
    const choices = container.querySelectorAll('.answer-card')
    expect(choices).toHaveLength(3)

    fireEvent.click(choices[1]) // choices[1] === 2, the correct quantity

    expect(screen.queryByRole('button', { name: /Turpināt/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Uzdevums 1 no 5')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS - 1) })
    expect(screen.getByLabelText('Uzdevums 1 no 5')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Turpināt/ })).not.toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByLabelText('Uzdevums 2 no 5')).toBeInTheDocument()
  })

  it('keeps the same round active on an incorrect answer and allows an immediate retry', () => {
    mockSpeech()
    vi.spyOn(games.dots, 'createRound').mockImplementation(() => ({
      kind: 'dots', quantity: 2, choices: [1, 2, 3],
      prompt: 'Atceries punktiņus!', speech: 'Atceries: divi punkti.',
    }))
    const profile = createProfile('Mia', 'lapsa', '2-3')
    const { container } = render(<GameSession gameId="dots" profile={profile} onExit={vi.fn()} onProgress={vi.fn()} />)

    act(() => { vi.advanceTimersByTime(1500) })
    const choices = container.querySelectorAll('.answer-card')
    fireEvent.click(choices[0]) // choices[0] === 1, incorrect

    expect(container.querySelector('.feedback-card.try-again')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS + 500) })
    expect(screen.getByLabelText('Uzdevums 1 no 5')).toBeInTheDocument()
    expect(container.querySelector('.feedback-card.try-again')).toBeInTheDocument()

    // Retry is immediate: the choice buttons are still interactive.
    fireEvent.click(choices[1])
    expect(container.querySelector('.feedback-card.correct')).toBeInTheDocument()
  })
})

describe('Count and Put In auto-transition', () => {
  it('never renders a Gatavs button and auto-advances to the number question once the pile matches the target, speaking the question', () => {
    const speak = mockSpeech()
    vi.spyOn(games.count, 'createRound').mockImplementation(() => ({
      kind: 'count', target: 2, choices: [1, 2, 3],
      object: { icon: 'apple', gender: 'm', one: 'ābolu', many: 'ābolus' },
      prompt: 'Ieliec grozā divus ābolus!', speech: 'Ieliec grozā divus ābolus.',
    }))
    const profile = createProfile('Mia', 'lapsa', '4-5')
    render(<GameSession gameId="count" profile={profile} onExit={vi.fn()} onProgress={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /Gatavs/ })).not.toBeInTheDocument()

    const pileButtons = screen.getAllByLabelText('Ielikt grozā')
    fireEvent.click(pileButtons[0])
    expect(screen.queryByText('Cik gardumu ir grozā?')).not.toBeInTheDocument()

    fireEvent.click(pileButtons[0])
    expect(screen.getByText('Cik gardumu ir grozā?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gatavs/ })).not.toBeInTheDocument()
    expect(spokenTexts(speak)).toContain('Cik gardumu ir grozā?')
  })
})

describe('Memory Market auto-validate with a memory guard', () => {
  function renderMarket(onProgress = vi.fn()) {
    vi.spyOn(games.market, 'createRound').mockImplementation(() => ({
      kind: 'market',
      first: { name: 'ābolus', icon: 'apple', count: 2 },
      prompt: 'Lūdzu, divus ābolus!', speech: 'Lūdzu, paņem divus ābolus.',
    }))
    const profile = createProfile('Mia', 'lapsa', '5-6')
    const result = render(<GameSession gameId="market" profile={profile} onExit={vi.fn()} onProgress={onProgress} />)
    return { ...result, onProgress }
  }

  it('disables the counters while the shopping list is still visible', () => {
    mockSpeech()
    renderMarket()
    expect(screen.queryByRole('button', { name: /Pārbaudīt/ })).not.toBeInTheDocument()
    const more = screen.getByLabelText('Vairāk ābolus')
    expect(more).toBeDisabled()
  })

  it('enables counters after the list folds, and auto-submits only on an exact match, recording no attempt for intermediate adjustments', () => {
    mockSpeech()
    const { onProgress } = renderMarket()

    act(() => { vi.advanceTimersByTime(2600) }) // list folds
    const more = screen.getByLabelText('Vairāk ābolus')
    expect(more).not.toBeDisabled()

    fireEvent.click(more) // count = 1, not yet matching target of 2
    expect(onProgress).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /Pārbaudīt/ })).not.toBeInTheDocument()

    fireEvent.click(more) // count = 2, exact match -> auto-submit
    expect(onProgress).toHaveBeenCalledTimes(1)
    const [, progress] = onProgress.mock.calls[0]
    expect(progress.attempts).toBe(1)
    expect(progress.correct).toBe(1)
    expect(screen.queryByRole('button', { name: /Pārbaudīt/ })).not.toBeInTheDocument()
  })
})
