# Crystalica

Enciclopedia ta personală de cristale — un site static construit cu **Astro** și deployat pe **Cloudflare Pages**.

## Prezentare

Crystalica prezintă 52 de cristale din colecția personală, fiecare cu descrieri detaliate în română: proprietăți energetice, istorie, chakre, semne zodiacale, elemente, folosințe practice și combinații recomandate.

### Funcționalități

- **52 pagini de cristale** — fiecare cu secțiuni complete (Istorie, Vindecare, Folosințe, Îngrijire, Combinații)
- **9 categorii** — Cristale, Pendule, Brățari, Pandanțive, Obelisc, Piramide, Îngerași, Copacel, Colier
- **Design Natural/Organic** — palette de culori pământ, tipografie elegantă (Cormorant Garamond, DM Sans, Playfair Display)
- **SEO optimizat** — meta tags, Open Graph, Twitter Cards, JSON-LD
- **RSS feed** — `rss.xml` pentru notificare cristale noi
- **Sitemap** — generat automat
- **Responsive** — layout adaptabil pentru mobile, tablet, desktop
- **Lazy loading** imagini pentru performanță

## Tech Stack

| Tehnologie | Utilizare |
|------------|-----------|
| [Astro 7](https://astro.build) | Framework static, content collections |
| [Cloudflare Pages](https://pages.cloudflare.com) | Hosting + CDN |
| [Content Collections](https://docs.astro.build/en/guides/content-collections/) | Tipare sigură pentru cristale |
| [MDX](https://mdxjs.com) | Conținut rich cu componente |
| Tailwind CSS | Styling utility-first |

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
│   ├── crystals/       # 52 fișiere MDX (unul per cristal)
│   └── config.ts       # Schema Content Collection
├── components/
│   ├── crystal/        # CrystalHeader, CrystalSidebar, CrystalTabs
│   ├── home/           # Hero, FeaturedCrystals, CategoriesSection, IntroSection
│   └── layout/         # Header, Footer
├── layouts/
│   ├── BaseLayout.astro    # Root layout + SEO
│   └── CrystalLayout.astro # Layout detaliu cristal
├── pages/
│   ├── index.astro         # Homepage
│   ├── cristale/
│   │   ├── index.astro     # Lista toate cristalele
│   │   └── [slug].astro    # Detaliu cristal (dynamic)
│   ├── categorii/
│   │   ├── index.astro     # Lista categorii
│   │   └── [slug].astro    # Detalii categorie (static workarounds)
│   └── rss.xml.ts          # Feed RSS
└── styles/
    ├── tokens.css          # Design tokens (culori, spacing, type)
    └── global.css          # Reset + components
```

## Extensibilitate viitoare

Proiectul este construit pentru a suporta creșteri viitoare:
- **Forum** — prin adăugarea unor pagini dinamice cu Cloudflare D1 (database) sau integrare third-party
- **Autentificare** — Lucia Auth pe Cloudflare Workers
- **CV Cristal** — profil personal bazat pe cristalele posesate de utilizator

## License

© 2026 Crystalica. Toate drepturile rezervate.