import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('app flow', () => {
  it('creates a local child profile and shows all games', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Kā tevi sauc?'), { target: { value: 'Lote' } })
    fireEvent.click(screen.getByRole('button', { name: /Sākt spēlēties/i }))
    expect(screen.getByText('Sveiks, Lote!')).toBeInTheDocument()
    expect(screen.getByText('Mazo punktu pāri')).toBeInTheDocument()
    expect(screen.getByText('Atmiņas tirgus')).toBeInTheDocument()
  })

  it('switches age recommendations and opens caregiver progress', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Kā tevi sauc?'), { target: { value: 'Rūta' } })
    fireEvent.click(screen.getByRole('button', { name: /Sākt spēlēties/i }))
    fireEvent.click(within(screen.getByRole('group', { name: 'Vecuma grupa' })).getByRole('button', { name: /5–6 gadi/i }))
    expect(screen.getByText(/Ieteikts šim vecumam: 3 spēles/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Pieaugušajiem/i }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Rūta progresē')
  })
})
