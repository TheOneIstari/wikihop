export type PersonalBest = { score: number; clicks: number; seconds: number; completedAt: string }
const keyFor = (challengeId: string) => `wikihop:best:${challengeId}`

export const getPersonalBest = (challengeId: string): PersonalBest | null => {
  try { const value = localStorage.getItem(keyFor(challengeId)); return value ? JSON.parse(value) as PersonalBest : null } catch { return null }
}

export const savePersonalBest = (challengeId: string, result: PersonalBest): PersonalBest => {
  const current = getPersonalBest(challengeId)
  const best = !current || result.score > current.score || (result.score === current.score && result.seconds < current.seconds) ? result : current
  try { localStorage.setItem(keyFor(challengeId), JSON.stringify(best)) } catch { /* Storage may be blocked; gameplay still works. */ }
  return best
}
