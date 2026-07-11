import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameSession from '../GameSession'
import { createProfile } from '../storage'
import type { GameId } from '../types'

describe('game session smoke tests', () => {
  const profile = createProfile('Mia', 'lapsa', '5-6')
  const cases: Array<[GameId, string]> = [
    ['dots', 'Punktu pāri'],
    ['count', 'Saskaiti'],
    ['bigger', 'Lielākais'],
    ['path', 'Skaitļu taka'],
    ['market', 'Tirgus'],
  ]

  it.each(cases)('renders the %s game with a playable first round', (gameId, title) => {
    const onProgress = vi.fn()
    const { unmount } = render(<GameSession gameId={gameId} profile={profile} onExit={vi.fn()} onProgress={onProgress}/>)
    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByLabelText('Atgriezties')).toBeInTheDocument()
    expect(screen.getByLabelText(/Uzdevums 1 no/)).toBeInTheDocument()
    unmount()
  })
})
