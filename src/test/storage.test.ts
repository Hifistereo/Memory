import { describe, expect, it } from 'vitest'
import { createProfile, defaultData, loadData, migrateData, saveData, STORAGE_KEY } from '../storage'

describe('local profile storage', () => {
  it('creates complete progress for all five games', () => {
    const profile = createProfile('Māra', 'lapsa', '4-5')
    expect(Object.keys(profile.progress)).toHaveLength(5)
    expect(profile.nickname).toBe('Māra')
  })

  it('migrates partial data without losing a profile', () => {
    const profile = createProfile('Leo', 'varde', '5-6')
    const migrated = migrateData({ profiles: [{ ...profile, progress: { dots: { level: 3 } } }], selectedProfileId: profile.id })
    expect(migrated.version).toBe(1)
    expect(migrated.profiles[0].progress.dots.level).toBe(3)
    expect(migrated.profiles[0].progress.market.attempts).toBe(0)
  })

  it('falls back safely for invalid data', () => {
    expect(migrateData('broken')).toEqual(defaultData())
    localStorage.setItem(STORAGE_KEY, '{not-json')
    expect(loadData()).toEqual(defaultData())
  })

  it('saves and restores profiles', () => {
    const profile = createProfile('Anna', 'pūce', '2-3')
    saveData({ version: 1, profiles: [profile], selectedProfileId: profile.id })
    expect(loadData().profiles[0].nickname).toBe('Anna')
  })
})
