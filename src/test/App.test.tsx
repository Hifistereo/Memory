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

    // The caregiver view can reset progress and delete a profile, so it is now
    // behind an arithmetic gate. Answer it the way a grown-up would.
    expect(screen.getByRole('dialog')).toHaveTextContent('Atrisini, lai turpinātu')
    solveGate()
    expect(screen.getByRole('dialog')).toHaveTextContent('Rūta progresē')
  })

  it('keeps a child out of the caregiver view when the sum is wrong', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Kā tevi sauc?'), { target: { value: 'Rūta' } })
    fireEvent.click(screen.getByRole('button', { name: /Sākt spēlēties/i }))
    fireEvent.click(screen.getByRole('button', { name: /Pieaugušajiem/i }))

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Turpināt' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Nepareizi')
    expect(screen.queryByText(/progresē/)).not.toBeInTheDocument()
  })
})

/** Read the gate's own sum off the screen and answer it. */
function solveGate() {
  const sum = screen.getByRole('dialog').textContent ?? ''
  const [, a, b] = sum.match(/(\d+)\s*×\s*(\d+)/) ?? []
  expect(a).toBeTruthy()
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: String(Number(a) * Number(b)) } })
  fireEvent.click(screen.getByRole('button', { name: 'Turpināt' }))
}
