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

export function GameArtwork({ id }: { id: GameId }) {
  if (id === 'dots') return <svg viewBox="0 0 120 100" aria-hidden="true"><path d="M40 78C16 69 15 35 35 21c18-13 45-2 48 24 3 25-17 42-43 33Z" fill="#EF6B61"/><path d="M50 20c-4-9 1-17 10-18" fill="none" stroke="#3C7550" strokeWidth="5" strokeLinecap="round"/><path d="M50 21 35 78" stroke="#573F3B" strokeWidth="4"/><circle cx="39" cy="39" r="6" fill="#573F3B"/><circle cx="62" cy="31" r="6" fill="#573F3B"/><circle cx="57" cy="59" r="6" fill="#573F3B"/><circle cx="32" cy="61" r="5" fill="#573F3B"/><circle cx="88" cy="36" r="7" fill="#F4B54A"/><circle cx="99" cy="55" r="5" fill="#F4B54A"/></svg>
  if (id === 'count') return <svg viewBox="0 0 120 100" aria-hidden="true"><path d="M20 45h80L88 88H32L20 45Z" fill="#C68252"/><path d="M35 47c0-35 50-35 50 0" fill="none" stroke="#8E5939" strokeWidth="7"/><circle cx="47" cy="43" r="16" fill="#EF6B61"/><circle cx="73" cy="45" r="17" fill="#F4B54A"/><path d="M48 29c4-7 9-8 14-7" stroke="#4D8D5A" strokeWidth="5" strokeLinecap="round"/><path d="m73 29 4-9" stroke="#4D8D5A" strokeWidth="5" strokeLinecap="round"/></svg>
  if (id === 'bigger') return <svg viewBox="0 0 120 100" aria-hidden="true"><path d="M22 72c-9-33 12-59 42-52 25 6 39 34 23 57-13 18-59 14-65-5Z" fill="#55A9A6"/><path d="m76 27 12-13 2 21M45 22 36 9l-5 22" fill="#F4B54A"/><circle cx="51" cy="47" r="5" fill="#fff"/><circle cx="78" cy="47" r="5" fill="#fff"/><circle cx="52" cy="48" r="2"/><circle cx="79" cy="48" r="2"/><path d="M54 64c8 6 16 6 23-1" fill="none" stroke="#244D50" strokeWidth="4" strokeLinecap="round"/><path d="M25 62 8 53M91 60l19-8" stroke="#55A9A6" strokeWidth="8" strokeLinecap="round"/></svg>
  if (id === 'path') return <svg viewBox="0 0 120 100" aria-hidden="true"><path d="M30 65c-4-23 12-43 35-43s38 21 31 43c-8 26-61 26-66 0Z" fill="#72B765"/><circle cx="49" cy="32" r="12" fill="#8BD17C"/><circle cx="79" cy="32" r="12" fill="#8BD17C"/><circle cx="49" cy="31" r="4"/><circle cx="79" cy="31" r="4"/><path d="M52 58c8 7 17 7 25 0" fill="none" stroke="#285D3B" strokeWidth="4" strokeLinecap="round"/><path d="m34 75-16 14M91 75l14 14" stroke="#72B765" strokeWidth="9" strokeLinecap="round"/></svg>
  return <svg viewBox="0 0 120 100" aria-hidden="true"><path d="M19 39h82v51H19z" fill="#F4D6A2"/><path d="M12 39 25 13h70l13 26Z" fill="#EF6B61"/><path d="M25 13v26M43 13v26M60 13v26M78 13v26M95 13v26" stroke="#FFF5E9" strokeWidth="8"/><rect x="31" y="55" width="25" height="35" rx="4" fill="#70A8B6"/><rect x="67" y="54" width="22" height="18" rx="4" fill="#FFF5E9"/><circle cx="78" cy="64" r="7" fill="#F4B54A"/></svg>
}

export function ItemIcon({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`item-icon item-${name} item-${size}`} aria-hidden="true"><i /></span>
}

export function DotGroup({ count, small = false }: { count: number; small?: boolean }) {
  return <span className={`dot-group ${small ? 'small' : ''}`} aria-label={`${count} punkti`}>{Array.from({ length: count }, (_, i) => <i key={i} />)}</span>
}
