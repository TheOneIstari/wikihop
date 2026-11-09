import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { challenges, type Challenge } from './challenges'
import { fetchArticle, getArticleTitleFromHref, type WikiArticle } from './lib/wikipedia'
import { formatTime, scoreRun } from './lib/scoring'
import { getPersonalBest, savePersonalBest, type PersonalBest } from './lib/storage'

type GameState = 'select' | 'loading' | 'playing' | 'victory' | 'error'
const normalizeTitle = (title: string) => title.replaceAll('_', ' ').trim().toLocaleLowerCase()

export default function App() {
  const [gameState, setGameState] = useState<GameState>('select')
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [article, setArticle] = useState<WikiArticle | null>(null)
  const [targetTitle, setTargetTitle] = useState('')
  const [route, setRoute] = useState<string[]>([])
  const [clicks, setClicks] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [finalSeconds, setFinalSeconds] = useState(0)
  const [error, setError] = useState('')
  const [bests, setBests] = useState<Record<string, PersonalBest | null>>(() =>
    Object.fromEntries(challenges.map((item) => [item.id, getPersonalBest(item.id)])),
  )
  const startedAtRef = useRef(0)
  const articleRef = useRef<HTMLElement>(null)
  const requestRef = useRef(0)

  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'loading') return
    const update = () => setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [gameState])

  useEffect(() => {
    if (article && articleRef.current) articleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [article])

  const finishGame = useCallback((finishedRoute: string[], finishedClicks: number) => {
    if (!challenge) return
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
    const result: PersonalBest = { clicks: finishedClicks, seconds: elapsed, score: scoreRun(finishedClicks, elapsed), completedAt: new Date().toISOString() }
    const best = savePersonalBest(challenge.id, result)
    setRoute(finishedRoute)
    setFinalSeconds(elapsed)
    setSeconds(elapsed)
    setBests((current) => ({ ...current, [challenge.id]: best }))
    setGameState('victory')
  }, [challenge])

  const loadArticle = useCallback(async (title: string, isNavigation = false) => {
    const requestId = ++requestRef.current
    setError('')
    if (isNavigation) setGameState('loading')
    try {
      const nextArticle = await fetchArticle(title)
      if (requestId !== requestRef.current) return
      const nextClicks = isNavigation ? clicks + 1 : 0
      const nextRoute = isNavigation ? [...route, nextArticle.title] : [nextArticle.title]
      setArticle(nextArticle)
      setClicks(nextClicks)
      setRoute(nextRoute)
      if (normalizeTitle(nextArticle.title) === normalizeTitle(targetTitle)) finishGame(nextRoute, nextClicks)
      else setGameState('playing')
    } catch (caught) {
      if (requestId !== requestRef.current) return
      setError(caught instanceof Error ? caught.message : 'This page could not be loaded.')
      setGameState(article ? 'playing' : 'error')
    }
  }, [article, clicks, finishGame, route, targetTitle])

  const startChallenge = useCallback(async (nextChallenge: Challenge) => {
    const requestId = ++requestRef.current
    setChallenge(nextChallenge)
    setArticle(null)
    setRoute([])
    setClicks(0)
    setSeconds(0)
    setFinalSeconds(0)
    setError('')
    setGameState('loading')
    startedAtRef.current = Date.now()
    try {
      const [start, target] = await Promise.all([fetchArticle(nextChallenge.start), fetchArticle(nextChallenge.target)])
      if (requestId !== requestRef.current) return
      setTargetTitle(target.title)
      setArticle(start)
      setRoute([start.title])
      setGameState(normalizeTitle(start.title) === normalizeTitle(target.title) ? 'victory' : 'playing')
    } catch (caught) {
      if (requestId !== requestRef.current) return
      setError(caught instanceof Error ? caught.message : 'The challenge could not be started.')
      setGameState('error')
    }
  }, [])

  const selectAnother = () => {
    requestRef.current += 1
    setGameState('select')
    setChallenge(null)
    setArticle(null)
    setError('')
  }

  const handleArticleClick = (event: React.MouseEvent<HTMLElement>) => {
    const anchor = (event.target as Element).closest('a')
    if (!anchor) return
    event.preventDefault()
    if (gameState !== 'playing') return
    const title = getArticleTitleFromHref(anchor.getAttribute('href') ?? '')
    if (!title) {
      setError('Only links to other Wikipedia articles count in WikiHop.')
      return
    }
    void loadArticle(title, true)
  }

  const currentScore = useMemo(() => scoreRun(clicks, gameState === 'victory' ? finalSeconds : seconds), [clicks, finalSeconds, gameState, seconds])

  return (
    <div className="app-shell">
      <header className="masthead">
        <button className="wordmark" onClick={selectAnother} aria-label="WikiHop home"><span className="wordmark-mark">W</span><span>WikiHop</span></button>
        <p className="masthead-note">The Wikipedia navigation game</p>
      </header>
      {gameState === 'select' ? (
        <main className="selection">
          <section className="hero">
            <p className="eyebrow">Three routes. Infinite detours.</p>
            <h1>How far apart are two ideas, really?</h1>
            <p className="hero-copy">Start on one Wikipedia article and reach the target using only the links you find along the way. No search. No shortcuts. Just curiosity.</p>
          </section>
          <section className="challenge-grid" aria-label="Challenges">
            {challenges.map((item, index) => {
              const best = bests[item.id]
              return (
                <button className={`challenge-card tone-${item.tone}`} key={item.id} onClick={() => void startChallenge(item)}>
                  <span className="card-number">0{index + 1}</span><span className="card-kicker">{item.kicker}</span><strong>{item.title}</strong>
                  <span className="card-route">{item.start} <i aria-hidden="true">→</i> {item.target}</span>
                  <span className="card-description">{item.description}</span>
                  <span className="card-footer"><span>{best ? `Best: ${best.score} pts · ${best.clicks} hops` : 'Unexplored'}</span><span className="play-link">Play route →</span></span>
                </button>
              )
            })}
          </section>
          <aside className="rules-strip"><span>01 · Pick a route</span><span>02 · Follow article links</span><span>03 · Reach the target</span></aside>
        </main>
      ) : (
        <main className="game-layout">
          <section className="game-bar" aria-label="Game status">
            <div className="destination-block"><span className="status-label">Destination</span><strong>{targetTitle || challenge?.target}</strong></div>
            <dl className="live-stats"><div><dt>Hops</dt><dd>{clicks}</dd></div><div><dt>Time</dt><dd>{formatTime(gameState === 'victory' ? finalSeconds : seconds)}</dd></div><div><dt>Score</dt><dd>{currentScore}</dd></div></dl>
            <button className="text-button" onClick={selectAnother}>Leave route</button>
          </section>
          {error && <div className="notice" role="alert"><span>{error}</span>{gameState === 'error' && challenge && <button onClick={() => void startChallenge(challenge)}>Try again</button>}</div>}
          {gameState === 'loading' && !article && <section className="loading-page" aria-live="polite"><span className="loading-rule" /><p>Opening the encyclopedia…</p></section>}
          {article && (
            <article className="reader" ref={articleRef} aria-busy={gameState === 'loading'}>
              <header className="article-header"><span className="article-label">From Wikipedia, the free encyclopedia</span><h1>{article.title}</h1>{gameState === 'loading' && <span className="page-loading">Following link…</span>}</header>
              <div className="wiki-content" onClick={handleArticleClick} dangerouslySetInnerHTML={{ __html: article.html }} />
            </article>
          )}
          {gameState === 'victory' && challenge && (
            <div className="victory-backdrop" role="dialog" aria-modal="true" aria-labelledby="victory-title">
              <section className="victory-card">
                <p className="eyebrow">Destination reached</p><h2 id="victory-title">You connected the dots.</h2><p className="victory-route-title">{challenge.start} → {challenge.target}</p>
                <div className="score-stamp"><strong>{currentScore}</strong><span>points</span></div>
                <div className="result-grid"><span><b>{clicks}</b> hops</span><span><b>{formatTime(finalSeconds)}</b> total time</span><span><b>{bests[challenge.id]?.score ?? currentScore}</b> personal best</span></div>
                <div className="path-block"><span className="status-label">Your complete path</span><ol>{route.map((title, index) => <li key={`${title}-${index}`}>{title}</li>)}</ol></div>
                <div className="victory-actions"><button className="primary-button" onClick={() => void startChallenge(challenge)}>Run it again</button><button className="secondary-button" onClick={selectAnother}>Choose another route</button></div>
              </section>
            </div>
          )}
        </main>
      )}
      <footer><span>Built with the Wikimedia API.</span><span>Article text and images are provided by Wikipedia under their respective licenses. <a href="https://en.wikipedia.org/wiki/Wikipedia:Copyrights" target="_blank" rel="noreferrer">Attribution & licensing</a></span></footer>
    </div>
  )
}
