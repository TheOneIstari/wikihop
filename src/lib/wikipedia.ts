import DOMPurify from 'dompurify'

const API_URL = 'https://en.wikipedia.org/w/api.php'
const WIKIPEDIA_ORIGIN = 'https://en.wikipedia.org'
const blockedNamespaces = new Set(['special','talk','user','user talk','wikipedia','wikipedia talk','file','file talk','mediawiki','mediawiki talk','template','template talk','help','help talk','category','category talk','portal','portal talk','draft','draft talk','timedtext','module','media'])
export type WikiArticle = { title: string; html: string; pageId: number; revisionId: number }
type ParseResponse = { error?: { info?: string }; parse?: { title: string; pageid: number; revid: number; text: string } }
const articleCache = new Map<string, Promise<WikiArticle>>()
const cacheKey = (title: string) => title.replaceAll('_', ' ').trim().toLocaleLowerCase()
const absolutizeUrl = (value: string) => value.startsWith('//') ? `https:${value}` : new URL(value, WIKIPEDIA_ORIGIN).href

export const getArticleTitleFromHref = (href: string): string | null => {
  if (!href || href.startsWith('#')) return null
  let url: URL
  try { url = new URL(href, WIKIPEDIA_ORIGIN) } catch { return null }
  if (url.hostname !== 'en.wikipedia.org' || !url.pathname.startsWith('/wiki/') || url.search) return null
  let title: string
  try { title = decodeURIComponent(url.pathname.slice('/wiki/'.length)).replaceAll('_', ' ').trim() } catch { return null }
  if (!title) return null
  const colon = title.indexOf(':')
  if (colon > 0 && blockedNamespaces.has(title.slice(0, colon).toLocaleLowerCase())) return null
  return title
}

const sanitizeArticle = (html: string) => {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['form','input','button','script','style','iframe','object'], FORBID_ATTR: ['style','srcdoc'] })
  const document = new DOMParser().parseFromString(clean, 'text/html')
  document.querySelectorAll('.mw-editsection,.mw-jump-link,.navbox,.vertical-navbox,.metadata,.sistersitebox,.noprint,style,script').forEach((element) => element.remove())
  document.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
    const source = image.getAttribute('src'); if (source) image.src = absolutizeUrl(source)
    const sourceSet = image.getAttribute('srcset')
    if (sourceSet) image.srcset = sourceSet.split(',').map((part) => { const [url, descriptor] = part.trim().split(/\s+/, 2); return `${absolutizeUrl(url)}${descriptor ? ` ${descriptor}` : ''}` }).join(', ')
    image.loading = 'lazy'
  })
  document.querySelectorAll<HTMLAnchorElement>('a').forEach((anchor) => {
    const title = getArticleTitleFromHref(anchor.getAttribute('href') ?? '')
    if (title) { anchor.href = `/wiki/${encodeURIComponent(title.replaceAll(' ', '_')).replaceAll('%2F', '/')}`; anchor.dataset.wikihopTitle = title }
    else { anchor.removeAttribute('href'); anchor.classList.add('wikihop-disabled-link') }
    anchor.removeAttribute('target')
  })
  return document.body.innerHTML
}

export const fetchArticle = (title: string): Promise<WikiArticle> => {
  const key = cacheKey(title)
  const cached = articleCache.get(key); if (cached) return cached
  const request = (async () => {
    const params = new URLSearchParams({ action: 'parse', page: title, prop: 'text|displaytitle|revid', redirects: '1', format: 'json', formatversion: '2', origin: '*' })
    const response = await fetch(`${API_URL}?${params.toString()}`)
    if (!response.ok) throw new Error(`Wikipedia returned HTTP ${response.status}. Please try again.`)
    const data = await response.json() as ParseResponse
    if (!data.parse) throw new Error(data.error?.info ?? 'Wikipedia could not find this article.')
    const article = { title: data.parse.title, html: sanitizeArticle(data.parse.text), pageId: data.parse.pageid, revisionId: data.parse.revid }
    articleCache.set(cacheKey(article.title), Promise.resolve(article))
    return article
  })()
  articleCache.set(key, request)
  request.catch(() => articleCache.delete(key))
  return request
}

export const clearArticleCache = () => articleCache.clear()
