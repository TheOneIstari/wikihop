import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import * as wikipedia from './lib/wikipedia'
vi.mock('./lib/wikipedia', async (importOriginal) => ({ ...await importOriginal<typeof wikipedia>(), fetchArticle: vi.fn() }))
describe('WikiHop gameplay', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    vi.mocked(wikipedia.fetchArticle).mockImplementation(async (title) => ({ title, pageId: 1, revisionId: 1, html: title === 'Homer Simpson' ? '<p>Take a leap into <a href="/wiki/Quantum_mechanics">quantum mechanics</a>.</p>' : '<p>The destination article.</p>' }))
  })
  it('selects a challenge, follows an article link and completes the run', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /cartoons to science/i }))
    expect(await screen.findByRole('heading', { name: 'Homer Simpson' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'quantum mechanics' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('You connected the dots.')).toBeInTheDocument()
    expect(screen.getByText((_, element) => element?.textContent === '1 hops')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('wikihop:best:cartoons-science') ?? '{}')).toMatchObject({ clicks: 1 })
  })
})
