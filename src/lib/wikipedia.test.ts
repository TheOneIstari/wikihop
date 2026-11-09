import { describe, expect, it } from 'vitest'
import { getArticleTitleFromHref } from './wikipedia'
describe('Wikipedia link handling', () => {
  it('accepts English Wikipedia article links', () => { expect(getArticleTitleFromHref('/wiki/Quantum_mechanics')).toBe('Quantum mechanics'); expect(getArticleTitleFromHref('https://en.wikipedia.org/wiki/Roman_Empire')).toBe('Roman Empire') })
  it('rejects non-article and interface links', () => { expect(getArticleTitleFromHref('#History')).toBeNull(); expect(getArticleTitleFromHref('/wiki/File:Homer_Simpson.png')).toBeNull(); expect(getArticleTitleFromHref('/w/index.php?title=Homer_Simpson')).toBeNull(); expect(getArticleTitleFromHref('https://example.com/wiki/Octopus')).toBeNull() })
})
