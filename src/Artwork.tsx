import type { GameId } from './types'

export function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 55C18 45 13 28 22 17c5-6 15-7 22-2 11 8 9 25-12 40Z" fill="#F4B54A" />
      <path d="M30 17c0-8 5-12 12-12-1 7-5 11-12 12Z" fill="#4D8D5A" />
      <circle cx="26" cy="29" r="3" fill="#59483D"/><circle cx="39" cy="29" r="3" fill="#59483D"/>
      <path d="M27 38c3 3 7 3 10 0" fill="none" stroke="#59483D" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

const GAME_ART: Record<GameId, string> = {
  dots: 'games/dots.png',
  count: 'games/count.png',
  bigger: 'games/bigger.png',
  path: 'games/path.png',
  market: 'games/market.png',
}

export function GameArtwork({ id }: { id: GameId }) {
  return <img className="game-artwork" src={`${import.meta.env.BASE_URL}assets/${GAME_ART[id]}`} alt="" aria-hidden="true" loading="lazy" />
}

export function ItemIcon({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`item-icon item-${name} item-${size}`} aria-hidden="true"><i /></span>
}

export function DotGroup({ count, small = false }: { count: number; small?: boolean }) {
  return <span className={`dot-group ${small ? 'small' : ''}`} aria-label={`${count} punkti`}>{Array.from({ length: count }, (_, i) => <i key={i} />)}</span>
}
