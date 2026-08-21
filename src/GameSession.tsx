import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Minus, RotateCcw, Volume2 } from 'lucide-react'
import { DotGroup, GameArtwork, ItemIcon } from './Artwork'
import { games, numberWord, pointsPhrase, recordAttempt } from './games'
import type { GameId, GameProgress, GameRound, Profile } from './types'
import { useSpeech } from './useSpeech'

interface Props {
  gameId: GameId
  profile: Profile
  onExit: () => void
  onProgress: (gameId: GameId, progress: GameProgress) => void
}

export const AUTO_ADVANCE_DELAY_MS = 1100

const encouragement = ['Lieliski!', 'Tev izdodas!', 'Pareizi!', 'Brīnišķīgi!']

function Representation({ value, mode, sum }: { value: number; mode: 'dots' | 'number' | 'sum'; sum?: [number, number] }) {
  if (mode === 'dots') return <DotGroup count={value} />
  if (mode === 'sum' && sum) return <span className="sum-view">{sum[0]} + {sum[1]}</span>
  return <span className="big-number">{value}</span>
}

function explanation(round: GameRound, answer: unknown): string {
  if (round.kind === 'dots') return `Te bija ${pointsPhrase(round.quantity)}.`
  if (round.kind === 'count') {
    const noun = round.target === 1 ? round.object.one : round.object.many
    const word = numberWord(round.target, round.object.gender, 'acc')
    const lead = Number(answer) < round.target ? 'Vajag vēl!' : 'Mazliet par daudz.'
    return `${lead} Grozā jāieliek tieši ${word} ${noun}.`
  }
  if (round.kind === 'bigger') return `${numberWord(Math.max(round.left, round.right))} ir vairāk nekā ${numberWord(Math.min(round.left, round.right))}.`
  if (round.kind === 'path') return `Pareizais akmens ir ${numberWord(round.target)}.`
  return `Apskati sarakstu vēlreiz: ${round.prompt.replace('Lūdzu, ', '').replace('!', '')}.`
}

export default function GameSession({ gameId, profile, onExit, onProgress }: Props) {
  const game = games[gameId]
  const [progress, setProgress] = useState(profile.progress[gameId])
  const [roundIndex, setRoundIndex] = useState(0)
  const [round, setRound] = useState(() => game.createRound(progress.level, 0))
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null)
  const [completed, setCompleted] = useState(false)
  const [visibleMemory, setVisibleMemory] = useState(true)
  const [selectedCount, setSelectedCount] = useState(0)
  const [countPhase, setCountPhase] = useState<'collect' | 'number'>('collect')
  const [marketCounts, setMarketCounts] = useState<Record<string, number>>({})
  const startedAt = useRef(Date.now())
  const { speak, available } = useSpeech(profile.preferences.sound)

  useEffect(() => {
    setFeedback(null)
    setVisibleMemory(true)
    setSelectedCount(0)
    setCountPhase('collect')
    setMarketCounts({})
    startedAt.current = Date.now()
    const speechTimer = window.setTimeout(() => speak(round.speech), 250)
    const hideDelay = round.kind === 'dots' ? 1500 : round.kind === 'market' ? 2600 : 0
    const hideTimer = hideDelay ? window.setTimeout(() => setVisibleMemory(false), hideDelay) : undefined
    return () => { window.clearTimeout(speechTimer); if (hideTimer) window.clearTimeout(hideTimer) }
  }, [round, speak])

  const submit = (answer: unknown) => {
    if (feedback?.correct) return
    const correct = game.evaluate(round, answer)
    const nextProgress = recordAttempt(progress, correct, Date.now() - startedAt.current)
    setProgress(nextProgress)
    onProgress(gameId, nextProgress)
    const text = correct ? encouragement[Math.floor(Math.random() * encouragement.length)] : explanation(round, answer)
    setFeedback({ correct, text })
    speak(text)
  }

  const nextRound = () => {
    if (roundIndex + 1 >= game.sessionLength) {
      const accuracy = progress.recent.slice(-game.sessionLength).filter(Boolean).length / Math.min(game.sessionLength, progress.recent.length || 1)
      const stars = Math.max(1, Math.round(accuracy * 3))
      const finished = { ...progress, sessions: progress.sessions + 1, stars: progress.stars + stars }
      setProgress(finished)
      onProgress(gameId, finished)
      setCompleted(true)
      const starWord = stars === 1 ? 'zvaigzni' : 'zvaigznes'
      speak(`Spēle pabeigta. Tu ieguvi ${numberWord(stars, 'f', 'acc')} ${starWord}!`)
      return
    }
    const index = roundIndex + 1
    setRoundIndex(index)
    setRound(game.createRound(progress.level, index))
  }

  useEffect(() => {
    if (!feedback?.correct) return
    const timer = window.setTimeout(nextRound, AUTO_ADVANCE_DELAY_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback])

  useEffect(() => {
    if (round.kind === 'count' && countPhase === 'collect' && selectedCount === round.target) {
      setCountPhase('number')
      speak('Cik gardumu ir grozā?')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCount, round, countPhase])

  useEffect(() => {
    if (round.kind !== 'market' || feedback || visibleMemory) return
    const items = [round.first, ...(round.second ? [round.second] : [])]
    if (items.every((item) => marketCounts[item.icon] === item.count)) submit(marketCounts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketCounts, round, feedback, visibleMemory])

  const replay = () => {
    setVisibleMemory(true)
    speak(round.speech)
    const next = { ...progress, hintsUsed: progress.hintsUsed + 1 }
    setProgress(next)
    onProgress(gameId, next)
    if (round.kind === 'dots' || round.kind === 'market') window.setTimeout(() => setVisibleMemory(false), 1900)
  }

  if (completed) {
    const stars = Math.max(1, Math.round(progress.recent.slice(-game.sessionLength).filter(Boolean).length / game.sessionLength * 3))
    return <main className="game-shell completion-screen" style={{ '--game': game.meta.accent } as React.CSSProperties}>
      <div className="confetti-dots" aria-hidden="true" />
      <GameArtwork id={gameId} />
      <p className="eyebrow">Spēle pabeigta</p>
      <h1>Tu lieliski pastrādāji, {profile.nickname}!</h1>
      <div className="earned-stars" aria-label={`${stars} zvaigznes`}>{Array.from({ length: 3 }, (_, i) => <span className={i < stars ? 'earned' : ''} key={i}>★</span>)}</div>
      <p>Katrs mēģinājums palīdz smadzenēm augt.</p>
      <div className="completion-actions">
        <button className="secondary-button" onClick={() => { setCompleted(false); setRoundIndex(0); setRound(game.createRound(progress.level, 0)) }}><RotateCcw size={20}/> Spēlēt vēlreiz</button>
        <button className="primary-button" onClick={onExit}>Uz spēļu dārzu</button>
      </div>
    </main>
  }

  return (
    <main className={`game-shell game-${gameId} ${profile.preferences.reducedMotion ? 'reduce-motion' : ''}`} style={{ '--game': game.meta.accent, '--game-soft': game.meta.color } as React.CSSProperties}>
      <header className="game-header">
        <button className="icon-button back-button" onClick={onExit} aria-label="Atgriezties"><ArrowLeft /></button>
        <div className="round-progress" aria-label={`Uzdevums ${roundIndex + 1} no ${game.sessionLength}`}>
          <span>{roundIndex + 1} / {game.sessionLength}</span>
          <div><i style={{ width: `${(roundIndex / game.sessionLength) * 100}%` }} /></div>
        </div>
        <button className="icon-button" onClick={replay} aria-label="Atkārtot uzdevumu"><Volume2 /><span className="audio-state">{available ? '' : 'Aa'}</span></button>
      </header>

      <section className="game-stage" aria-live="polite">
        <div className="game-title-mini"><span className="mini-art"><GameArtwork id={gameId}/></span><span>{game.meta.shortTitle}</span></div>
        <h1 className="round-prompt">{round.prompt}</h1>

        {round.kind === 'dots' && <div className="dots-game-area">
          <div className={`memory-card ${visibleMemory ? '' : 'hidden-memory'}`}>{visibleMemory ? <DotGroup count={round.quantity}/> : <span className="question-mark">?</span>}</div>
          {!visibleMemory && <div className="choice-row">{round.choices.map((choice) => <button key={choice} className="answer-card" onClick={() => submit(choice)} disabled={feedback?.correct}><DotGroup count={choice}/></button>)}</div>}
        </div>}

        {round.kind === 'count' && <div className="count-game-area">
          {countPhase === 'collect' ? <>
            <div className="object-pile">{Array.from({ length: Math.max(8, round.target + 2) }, (_, i) => <button key={i} onClick={() => setSelectedCount((n) => Math.min(8, n + 1))} aria-label="Ielikt grozā"><ItemIcon name={round.object.icon} size="lg"/></button>)}</div>
            <div className="basket-zone"><div className="basket-items">{Array.from({ length: selectedCount }, (_, i) => <button key={i} onClick={() => setSelectedCount((n) => Math.max(0, n - 1))} aria-label="Izņemt no groza"><ItemIcon name={round.object.icon}/></button>)}</div><div className="basket-illustration"><span>{selectedCount}</span></div></div>
          </> : <div className="number-question"><p>Cik gardumu ir grozā?</p><div className="choice-row">{round.choices.map((number) => <button className="number-choice" key={number} onClick={() => submit(number)}>{number}</button>)}</div></div>}
        </div>}

        {round.kind === 'bigger' && <div className="bigger-game-area">
          <button className="compare-card left" onClick={() => submit('left')}><Representation value={round.left} mode={round.leftMode} sum={round.leftSum}/><span>Šeit</span></button>
          <div className="versus">vai</div>
          <button className="compare-card right" onClick={() => submit('right')}><Representation value={round.right} mode={round.rightMode} sum={round.rightSum}/><span>Šeit</span></button>
          <div className="race-track" aria-hidden="true"><i style={{ width: `${((roundIndex + (feedback?.correct ? 1 : 0)) / game.sessionLength) * 100}%` }}><span>●</span></i></div>
        </div>}

        {round.kind === 'path' && <div className="path-game-area">
          {round.start && <div className="frog-start">Varde sāk pie <strong>{round.start}</strong></div>}
          <div className="number-path">{Array.from({ length: round.max }, (_, i) => i + 1).map((number) => <button key={number} className={number === round.start ? 'start-tile' : ''} onClick={() => submit(number)}><span>{number === round.start ? '●' : ''}</span>{number}</button>)}</div>
        </div>}

        {round.kind === 'market' && <div className="market-game-area">
          <div className={`shopping-note ${visibleMemory ? '' : 'folded'}`}>{visibleMemory ? <><span>Iepirkumu saraksts</span><strong>{round.first.count} × {round.first.name}{round.second ? `  •  ${round.second.count} × ${round.second.name}` : ''}</strong></> : <><span>Saraksts nolikts malā</span><strong>Vai atceries?</strong></>}</div>
          <div className="market-shelves">{[round.first, ...(round.second ? [round.second] : [])].map((item) => <div className="market-item" key={item.icon}><ItemIcon name={item.icon} size="lg"/><strong>{item.name}</strong><div className="counter"><button onClick={() => setMarketCounts((c) => ({ ...c, [item.icon]: Math.max(0, (c[item.icon] || 0) - 1) }))} aria-label={`Mazāk ${item.name}`} disabled={visibleMemory || feedback?.correct}><Minus/></button><span>{marketCounts[item.icon] || 0}</span><button onClick={() => setMarketCounts((c) => ({ ...c, [item.icon]: Math.min(8, (c[item.icon] || 0) + 1) }))} aria-label={`Vairāk ${item.name}`} disabled={visibleMemory || feedback?.correct}>+</button></div></div>)}</div>
        </div>}

        {feedback && <div className={`feedback-card ${feedback.correct ? 'correct' : 'try-again'}`} role="status"><span>{feedback.correct ? '✓' : '•'}</span><p>{feedback.text}</p></div>}
      </section>
    </main>
  )
}
