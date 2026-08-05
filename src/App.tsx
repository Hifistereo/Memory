import { useEffect, useMemo, useState } from 'react'
import { BarChart3, ChevronRight, Plus, Settings, Star, Trash2, Volume2, VolumeX, X } from 'lucide-react'
import { GameArtwork, LogoMark } from './Artwork'
import GameSession from './GameSession'
import { gameList } from './games'
import { createProfile, defaultData, loadData, saveData } from './storage'
import type { AgeBand, AppData, GameId, GameProgress, Profile } from './types'

const avatars = [
  { id: 'lapsa', label: 'Lapsa', face: '●ᴥ●', color: '#E57845' },
  { id: 'varde', label: 'Varde', face: '•ᴗ•', color: '#5EA668' },
  { id: 'pūce', label: 'Pūce', face: '◉v◉', color: '#8666A8' },
  { id: 'lācis', label: 'Lācis', face: '•㉨•', color: '#A87954' },
]

function Avatar({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' | 'lg' }) {
  const avatar = avatars.find((item) => item.id === id) ?? avatars[0]
  return <span className={`avatar avatar-${size}`} style={{ background: avatar.color }} aria-label={avatar.label}><i/><b>{avatar.face}</b></span>
}

function ProfilePicker({ data, onSelect, onCreate }: { data: AppData; onSelect: (id: string) => void; onCreate: (profile: Profile) => void }) {
  const [creating, setCreating] = useState(data.profiles.length === 0)
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState(avatars[0].id)
  const [ageBand, setAgeBand] = useState<AgeBand>('4-5')

  const addProfile = (event: React.FormEvent) => {
    event.preventDefault()
    if (!nickname.trim()) return
    onCreate(createProfile(nickname, avatar, ageBand))
  }

  return <main className="profile-page">
    <div className="garden-sun" aria-hidden="true"/>
    <header className="brand-lockup"><LogoMark/><div><strong>Ciparu dārzs</strong><span>Augam, spēlējoties!</span></div></header>
    <section className="profile-panel">
      {!creating ? <>
        <p className="eyebrow">Sveicināti!</p>
        <h1>Kurš šodien spēlēs?</h1>
        <div className="profile-grid">{data.profiles.map((profile) => <button className="profile-card" key={profile.id} onClick={() => onSelect(profile.id)}><Avatar id={profile.avatar} size="lg"/><strong>{profile.nickname}</strong><span>{profile.ageBand.replace('-', '–')} gadi</span></button>)}
          {data.profiles.length < 4 && <button className="profile-card add-profile" onClick={() => setCreating(true)}><span className="add-circle"><Plus/></span><strong>Pievienot</strong><span>jaunu spēlētāju</span></button>}
        </div>
      </> : <form className="create-profile" onSubmit={addProfile}>
        <button type="button" className="close-create" onClick={() => data.profiles.length ? setCreating(false) : undefined} aria-label="Aizvērt" disabled={!data.profiles.length}><X/></button>
        <p className="eyebrow">Jauns spēlētājs</p>
        <h1>Iepazīsimies!</h1>
        <label className="field-label" htmlFor="nickname">Kā tevi sauc?</label>
        <input id="nickname" autoFocus maxLength={16} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ieraksti vārdu" />
        <fieldset><legend>Izvēlies draugu</legend><div className="avatar-options">{avatars.map((item) => <button type="button" className={avatar === item.id ? 'selected' : ''} key={item.id} onClick={() => setAvatar(item.id)}><Avatar id={item.id}/><span>{item.label}</span></button>)}</div></fieldset>
        <fieldset><legend>Cik tev gadu?</legend><div className="age-options">{(['2-3', '4-5', '5-6'] as AgeBand[]).map((age) => <button type="button" className={ageBand === age ? 'selected' : ''} key={age} onClick={() => setAgeBand(age)}><strong>{age.replace('-', '–')}</strong><span>gadi</span></button>)}</div></fieldset>
        <button className="primary-button create-button" type="submit" disabled={!nickname.trim()}>Sākt spēlēties <ChevronRight/></button>
      </form>}
    </section>
    <p className="privacy-note">Bez reklāmām · Bez pirkumiem · Dati paliek šajā ierīcē</p>
    {/* Back to the other KidMindPath games. Profile picker only — this is the
        screen a grown-up is looking at, and a control that leaves the app has
        no business next to a running game. Absolute URL because the app is
        also served from hifistereo.github.io/Memory/, where "/" is a
        different site. */}
    <a className="kmp-home hub-link" href="https://www.kidmindpath.com/"><span aria-hidden="true">←</span> KidMindPath</a>
  </main>
}

function ProgressRing({ progress }: { progress: GameProgress }) {
  const percent = progress.sessions ? Math.min(100, Math.round((progress.level / 4) * 100)) : 0
  return <div className="progress-ring" style={{ '--progress': `${percent * 3.6}deg` } as React.CSSProperties}><span>{progress.sessions ? `${percent}%` : 'Jauna'}</span></div>
}

function Home({ profile, ageFilter, setAgeFilter, onGame, onProfiles, onCaregiver, onToggleSound }: { profile: Profile; ageFilter: AgeBand; setAgeFilter: (age: AgeBand) => void; onGame: (id: GameId) => void; onProfiles: () => void; onCaregiver: () => void; onToggleSound: () => void }) {
  const recommended = gameList.filter((game) => game.meta.ageBands.includes(ageFilter))
  const stars = Object.values(profile.progress).reduce((sum, item) => sum + item.stars, 0)
  return <main className={`home-page ${profile.preferences.reducedMotion ? 'reduce-motion' : ''}`}>
    <header className="topbar">
      <div className="brand-lockup compact"><LogoMark/><div><strong>Ciparu dārzs</strong><span>Augam, spēlējoties!</span></div></div>
      <div className="top-actions">
        <button className="star-total" aria-label={`${stars} zvaigznes`}><Star fill="currentColor"/> {stars}</button>
        <button className="icon-button" onClick={onToggleSound} aria-label={profile.preferences.sound ? 'Izslēgt skaņu' : 'Ieslēgt skaņu'}>{profile.preferences.sound ? <Volume2/> : <VolumeX/>}</button>
        <button className="profile-chip" onClick={onProfiles}><Avatar id={profile.avatar} size="sm"/><span>{profile.nickname}</span><ChevronRight/></button>
      </div>
    </header>

    <section className="welcome-band">
      <div><p className="eyebrow">Sveiks, {profile.nickname}!</p><h1>Ko šodien<br/><em>atklāsim?</em></h1><p>Izvēlies spēli un dodies mazā piedzīvojumā.</p></div>
      <div className="welcome-art" aria-hidden="true"><span className="hill hill-one"/><span className="hill hill-two"/><GameArtwork id="bigger"/><i className="flower f1"/><i className="flower f2"/></div>
    </section>

    <section className="games-section">
      <div className="section-heading"><div><p className="eyebrow">Spēļu dārzs</p><h2>Izvēlies savu spēli</h2></div><button className="caregiver-link" onClick={onCaregiver}><BarChart3/> Pieaugušajiem</button></div>
      <div className="age-filter" role="group" aria-label="Vecuma grupa">{(['2-3', '4-5', '5-6'] as AgeBand[]).map((age) => <button className={ageFilter === age ? 'active' : ''} key={age} onClick={() => setAgeFilter(age)}><strong>{age.replace('-', '–')}</strong> gadi</button>)}</div>
      <p className="recommendation-note">Ieteikts šim vecumam: {recommended.length} {recommended.length === 1 ? 'spēle' : 'spēles'}</p>
      <div className="game-grid">{gameList.map((game) => {
        const progress = profile.progress[game.meta.id]
        const isRecommended = game.meta.ageBands.includes(ageFilter)
        return <article className={`game-card ${isRecommended ? 'recommended' : 'other-age'}`} key={game.meta.id} style={{ '--card': game.meta.color, '--accent': game.meta.accent } as React.CSSProperties}>
          <button className="game-card-main" onClick={() => onGame(game.meta.id)}>
            <span className="age-badge">{game.meta.ageLabel}</span>
            <span className="game-art"><GameArtwork id={game.meta.id}/></span>
            <span className="game-copy"><strong>{game.meta.title}</strong><small>{game.meta.description}</small><em>{game.meta.skill}</em></span>
            <ProgressRing progress={progress}/>
            <span className="play-arrow"><ChevronRight/></span>
          </button>
        </article>
      })}</div>
    </section>
    <footer><LogoMark/><p>Mazie soļi ved pie lieliem atklājumiem.</p><button onClick={onCaregiver}><Settings/> Iestatījumi un progress</button></footer>
  </main>
}

function CaregiverView({ profile, onClose, onUpdate, onDelete }: { profile: Profile; onClose: () => void; onUpdate: (profile: Profile) => void; onDelete: () => void }) {
  const totalSessions = Object.values(profile.progress).reduce((sum, p) => sum + p.sessions, 0)
  const totalAttempts = Object.values(profile.progress).reduce((sum, p) => sum + p.attempts, 0)
  const totalCorrect = Object.values(profile.progress).reduce((sum, p) => sum + p.correct, 0)
  const resetProgress = () => {
    if (!window.confirm('Vai tiešām dzēst visu šī spēlētāja progresu?')) return
    const fresh = createProfile(profile.nickname, profile.avatar, profile.ageBand)
    onUpdate({ ...fresh, id: profile.id, createdAt: profile.createdAt, preferences: profile.preferences })
  }
  return <div className="modal-backdrop"><section className="caregiver-modal" role="dialog" aria-modal="true" aria-labelledby="caregiver-title">
    <header><div><p className="eyebrow">Pieaugušo skats</p><h1 id="caregiver-title">{profile.nickname} progresē</h1></div><button className="icon-button" onClick={onClose} aria-label="Aizvērt"><X/></button></header>
    <div className="summary-cards"><div><strong>{totalSessions}</strong><span>Pabeigtas spēles</span></div><div><strong>{totalAttempts ? Math.round(totalCorrect / totalAttempts * 100) : 0}%</strong><span>Pareizas atbildes</span></div><div><strong>{Object.values(profile.progress).reduce((sum, p) => sum + p.stars, 0)}</strong><span>Zvaigznes</span></div></div>
    <p className="privacy-box">Šie dati glabājas tikai šajā pārlūkā. Tie netiek sūtīti internetā.</p>
    <div className="progress-list">{gameList.map((game) => { const p = profile.progress[game.meta.id]; const accuracy = p.attempts ? Math.round(p.correct / p.attempts * 100) : 0; return <div className="progress-row" key={game.meta.id}><span className="progress-art" style={{ background: game.meta.color }}><GameArtwork id={game.meta.id}/></span><div><strong>{game.meta.title}</strong><span>{p.sessions ? `${p.sessions} spēles · ${accuracy}% pareizi · ${p.hintsUsed} atkārtojumi` : 'Vēl nav spēlēts'}</span><div className="mastery-bar"><i style={{ width: `${p.sessions ? p.level * 25 : 0}%`, background: game.meta.accent }}/></div></div><b>{p.sessions ? `${p.level}. līm.` : '—'}</b></div>})}</div>
    <div className="settings-panel"><h2>Iestatījumi</h2><label><span><strong>Mazāk kustību</strong><small>Samazina animācijas un lēcienus</small></span><input type="checkbox" checked={profile.preferences.reducedMotion} onChange={(e) => onUpdate({ ...profile, preferences: { ...profile.preferences, reducedMotion: e.target.checked } })}/></label></div>
    <div className="danger-actions"><button onClick={resetProgress}>Atiestatīt progresu</button><button onClick={() => window.confirm('Vai dzēst šo spēlētāju no ierīces?') && onDelete()}><Trash2/> Dzēst profilu</button></div>
  </section></div>
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [screen, setScreen] = useState<'profiles' | 'home' | 'game'>('home')
  const [activeGame, setActiveGame] = useState<GameId | null>(null)
  const selectedProfile = useMemo(() => data.profiles.find((p) => p.id === data.selectedProfileId) ?? null, [data])
  const [ageFilter, setAgeFilter] = useState<AgeBand>(selectedProfile?.ageBand ?? '4-5')
  const [caregiverOpen, setCaregiverOpen] = useState(false)

  useEffect(() => saveData(data), [data])
  useEffect(() => { if (selectedProfile) setAgeFilter(selectedProfile.ageBand) }, [selectedProfile?.id])

  const selectProfile = (id: string) => { setData((d) => ({ ...d, selectedProfileId: id })); setScreen('home') }
  const addProfile = (profile: Profile) => { setData((d) => ({ ...d, profiles: [...d.profiles, profile], selectedProfileId: profile.id })); setScreen('home') }
  const updateProfile = (updated: Profile) => setData((d) => ({ ...d, profiles: d.profiles.map((p) => p.id === updated.id ? updated : p) }))
  const updateProgress = (gameId: GameId, progress: GameProgress) => setData((d) => ({ ...d, profiles: d.profiles.map((p) => p.id === d.selectedProfileId ? { ...p, progress: { ...p.progress, [gameId]: progress } } : p) }))

  if (!selectedProfile || screen === 'profiles') return <ProfilePicker data={data} onSelect={selectProfile} onCreate={addProfile}/>
  if (screen === 'game' && activeGame) return <GameSession gameId={activeGame} profile={selectedProfile} onExit={() => setScreen('home')} onProgress={updateProgress}/>

  return <>
    <Home profile={selectedProfile} ageFilter={ageFilter} setAgeFilter={setAgeFilter} onGame={(id) => { setActiveGame(id); setScreen('game') }} onProfiles={() => setScreen('profiles')} onCaregiver={() => setCaregiverOpen(true)} onToggleSound={() => updateProfile({ ...selectedProfile, preferences: { ...selectedProfile.preferences, sound: !selectedProfile.preferences.sound } })}/>
    {caregiverOpen && <CaregiverView profile={selectedProfile} onClose={() => setCaregiverOpen(false)} onUpdate={updateProfile} onDelete={() => { setData((d) => { const profiles = d.profiles.filter((p) => p.id !== selectedProfile.id); return { ...d, profiles, selectedProfileId: profiles[0]?.id ?? null } }); setCaregiverOpen(false) }}/>} 
  </>
}
