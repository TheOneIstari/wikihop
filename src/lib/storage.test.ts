import { beforeEach, describe, expect, it } from 'vitest'
import { getPersonalBest, savePersonalBest, type PersonalBest } from './storage'
const run = (score: number, seconds: number): PersonalBest => ({ score, seconds, clicks: 2, completedAt: '2026-11-09T00:00:00.000Z' })
describe('personal bests', () => {
  beforeEach(() => localStorage.clear())
  it('persists the highest score', () => { savePersonalBest('test', run(800, 20)); savePersonalBest('test', run(700, 10)); expect(getPersonalBest('test')?.score).toBe(800) })
  it('uses time as a tie-breaker', () => { savePersonalBest('test', run(800, 20)); savePersonalBest('test', run(800, 12)); expect(getPersonalBest('test')?.seconds).toBe(12) })
})
