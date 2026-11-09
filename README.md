# WikiHop

WikiHop is an editorial browser game: begin on one Wikipedia article and reach an unrelated destination using only links inside each article.

**Play:** <https://theoneistari.github.io/wikihop/>

## Features

- Three hand-picked Wikipedia navigation challenges
- Live article content from the MediaWiki Action API
- Sanitized remote HTML via DOMPurify
- Canonical-title and redirect-aware victory detection
- Timer, hop counter, route history and score
- Per-challenge personal bests in localStorage
- Responsive encyclopedia-inspired design

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm test
npm run build
```

## Attribution

Article text and images come from Wikipedia and are subject to their respective licenses. See [Wikipedia:Copyrights](https://en.wikipedia.org/wiki/Wikipedia:Copyrights).
