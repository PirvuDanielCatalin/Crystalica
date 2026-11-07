# Crystalica

Enciclopedia ta personală de cristale — un site static construit cu **Astro** și deployat pe **Cloudflare Pages**.

## Prezentare

Crystalica prezintă 52 de cristale din colecția personală, fiecare cu descrieri detaliate în română: proprietăți energetice, istorie, chakre, semne zodiacale, elemente, folosințe practice și combinații recomandate.

### Funcționalități

- **Pagini de cristale** — fiecare cu secțiuni complete (Istorie, Vindecare, Folosințe, Îngrijire, Combinații)
- **Design Natural/Organic** — palette de culori pământ, tipografie elegantă (Cormorant Garamond, DM Sans, Playfair Display)
- **SEO optimizat** — meta tags, Open Graph, Twitter Cards, JSON-LD
- **RSS feed** — `rss.xml` pentru notificare cristale noi
- **Sitemap** — generat automat
- **Responsive** — layout adaptabil pentru mobile, tablet, desktop
- **Lazy loading** imagini pentru performanță
- **Paginile de profil** (`/@[username]`) — buton de urmărire, tab-uri Comunitate/Configurație, contoruri de portofoliu, listă de dorințe, urmărite și urmăritori
- **Chatbot Botpress** — widget flotant în colțul dreapta-jos, disponibil pe toate paginile
- **Buton scroll-to-top** — pe pagina `/cristale`, poziționat stânga

## Tech Stack

| Tehnologie | Utilizare |
|------------|-----------|
| [Astro 7](https://astro.build) | Framework static, content collections |
| [Cloudflare Pages](https://pages.cloudflare.com) | Hosting + CDN |
| [Content Collections](https://docs.astro.build/en/guides/content-collections/) | Tipare sigură pentru cristale |
| [MDX](https://mdxjs.com) | Conținut rich cu componente |
| Tailwind CSS | Styling utility-first |
| Clerk | Autentificare și gestionare utilizatori |
| Botpress | Chatbot integrat |

## Construire & Run

```bash
# Instalează dependențe
npm install

# Dezvoltare local
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Preview în runtime-ul Cloudflare Pages
npm run preview:pages

# Teste Playwright
npm run test:playwright
```

Build-ul generează asset-urile statice în `dist/client/` și worker-ul SSR în `dist/client/_worker.js/` (necesar pentru rutele `/@[username]`).

## Rulare locală în Docker

Imaginea rulează build-ul de producție prin `wrangler pages dev` (workerd), exact ca în Cloudflare Pages.

```bash
# 1. Pregătește variabilele de mediu
cp .env.example .env
# Completează PUBLIC_CLERK_PUBLISHABLE_KEY și CLERK_SECRET_KEY în .env

# 2. Build + rulare
docker compose up --build
```

Site-ul este disponibil la `http://localhost:4321` (portul se poate schimba cu `APP_PORT` în `.env`).

**Notă:** `PUBLIC_CLERK_PUBLISHABLE_KEY` este **necesară la build** (se inline-uiește în bundle), în timp ce `CLERK_SECRET_KEY` e secret de runtime (fără ea, rutele `/@[username]` nu pot interoga Clerk).

### Release (GHCR)

La fiecare push pe `main`, CI-ul creează automat un tag semver și publică imaginea Docker în `ghcr.io/pirvudanielcatalin/crystalica`.

1. Bump-uiește `major` sau `minor` în `VERSION.json` (major/minor → `.0`, doar commit pe main → patch+1).
2. Comite și push-uiește pe `main` — workflow-ul creează tag-ul git `v{major}.{minor}.{patch}` și publică imaginea cu tagurile `X.Y.Z`, `X.Y`, `X` și `latest`.

## Deploy pe Cloudflare Pages

1. Conectează repository-ul GitHub la [Cloudflare Pages](https://dash.cloudflare.com/pages).
2. Selectează repo-ul `Crystalica`.
3. Setări build:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/client`
4. Adaugă variabilele de mediu `PUBLIC_CLERK_PUBLISHABLE_KEY` și `CLERK_SECRET_KEY` (secret).
5. Publică.

Site-ul va fi disponibil la `https://crystalica.pages.dev` (sau domeniul custom configurat).

## Structură proiect

```
src/
├── content/
│   ├── crystals/       # Fișiere MDX (unul per cristal)
│   └── config.ts       # Schema Content Collection
├── components/
│   ├── crystal/        # CrystalHeader, CrystalSidebar, CrystalTabs
│   ├── home/           # Hero, FeaturedCrystals, CategoriesSection, IntroSection
│   ├── layout/         # Header, Footer
│   └── collections/    # CollectionsController, CrystalActions
├── layouts/
│   ├── BaseLayout.astro    # Root layout + SEO + chatbot Botpress
│   └── CrystalLayout.astro # Layout detaliu cristal
├── pages/
│   ├── index.astro         # Homepage
│   ├── cristale/
│   │   ├── index.astro     # Lista toate cristalele (cu buton scroll-to-top stânga)
│   │   └── [slug].astro    # Detaliu cristal (dynamic)
│   ├── 404.astro           # Pagina 404
│   ├── @[username].astro   # Pagina de profil (SSR, autentificare Clerk)
│   └── rss.xml.ts          # Feed RSS
└── styles/
    ├── tokens.css          # Design tokens (culori, spacing, type)
    └── global.css          # Reset + componente
```

## Teste Playwright

Toate testele se rulează cu:

```bash
npm run test:playwright
```

Testele acoperă:
- Pagina de start (titlu, buton "Explorează Cristalele", scripturi Botpress)
- Listarea cristalelor (`/cristale`) — navigație A-Z, click → detaliu, buton scroll-to-top
- Pagină de detaliu cristal (`/cristale/[slug]`) — numele cristalului, săgețile de navigație
- Pagini de profil (`/@[username]`) — buton de urmărire, tab-uri, acțiuni, contoruri
- Pagina 404, feedul RSS (`/rss.xml`), prezența chatbotului Botpress pe toate paginile

Rezultatele testelor (`test-results/`, `playwright-report/`) și starea de autentificare (`tests/playwright/.auth/`) nu sunt incluse în Git (sunt în `.gitignore`).

## Extensibilitate viitoare

Proiectul este construit pentru a suporta creșteri viitoare:
- **Forum** — prin adăugarea unor pagini dinamice cu Cloudflare D1 (database) sau integrare third-party
- **Autentificare** — Lucia Auth pe Cloudflare Workers
- **CV Cristal** — profil personal bazat pe cristalele posesate de utilizator

## License

© 2026 Crystalica. Toate drepturile rezervate.