import { describe, expect, it } from 'vitest'
import { formatTime, scoreRun } from './scoring'
describe('scoring', () => {
  it('rewards fewer hops and faster runs', () => { expect(scoreRun(3, 10)).toBe(817); expect(scoreRun(20, 900)).toBe(0) })
  it('formats elapsed time', () => { expect(formatTime(0)).toBe('0:00'); expect(formatTime(125)).toBe('2:05') })
})
