# Crystalica - Deployment Guide

Acest document descrie comenzile necesare pentru dezvoltare locală, construirea site-ului și deploy pe Cloudflare Pages.

## Comenzi esențiale

### 1. Build (Construire)

```bash
npm run build
```

Această comandă generează site-ul static în `dist/client/` și worker-ul SSR în `dist/server/` (Astro + `@astrojs/cloudflare`). La final, `scripts/prepare-pages-worker.mjs` copiază bundle-ul SSR în `dist/client/_worker.js/`, astfel încât Cloudflare Pages să ruleze rutele dinamice (`/@[username]`).

> Fără `dist/client/_worker.js/`, Pages publică doar fișiere statice, iar `/@[username]` (singura rută `prerender = false`) întoarce 404.

### 2. Deploy (Publicare)

Nu este nevoie de comandă manuală de deploy. Proiectul este configurat pentru **Continuous Deployment** prin integrarea GitHub - Cloudflare Pages:

- Când faci push pe `main`, Cloudflare detectează automat schimbarea și pornește build-ul.
- Odată build-ul finalizat cu succes, site-ul este publicat automat.

Pentru deploy manual (opțional), poți folosi:
```bash
# Prin Cloudflare CLI (wrangler)
npx wrangler pages deploy dist/client
```

### 3. Preview (Previzualizare)

```bash
# Preview Astro (rulează worker-ul generat)
npm run preview

# Preview în runtime-ul Cloudflare Pages (simulează producția)
npm run preview:pages
```

`npm run preview` reface `.wrangler/deploy/config.json` (șters intenționat de build), iar `npm run preview:pages` servește `dist/client/` exact ca Pages, inclusiv `_worker.js`.

## Development

```bash
# Instalează dependențele
npm install

# Lansează serverul de developare cu hot-reload
npm run dev
```

Serverul va fi disponibil la `http://localhost:4321`.

## Configurație Cloudflare Pages

Când configurezi repository-ul pe [Cloudflare Dashboard](https://dash.cloudflare.com):

- **Framework preset**: Astro
- **Build command**: `npm run build`
- **Build output directory**: `dist/client`
- **Root directory**: `/` ( rădăcina repository-ului )

> **Important**: `dist/client/` trebuie să conțină și directorul `_worker.js/` generat de `npm run build`. Acesta rulează rutele SSR (`/@[username]`, `/_server-islands/*`, `/_image`). Fără el, doar paginile statice funcționează.

Variabile de mediu (Settings → Environment variables), atât pentru Production cât și pentru Preview:

- `PUBLIC_CLERK_PUBLISHABLE_KEY` — cheia publică Clerk (client)
- `CLERK_SECRET_KEY` — cheia secretă Clerk (server, marcată ca *Secret*)

Fără `CLERK_SECRET_KEY`, paginile de profil se randau cu mesajul „Profil negăsit”.

Site-ul va fi disponibil la:
- **Production URL**: `https://crystalica.pages.dev`
- **Preview URL**: `https://<commit-hash>.crystalica.pages.dev`

## Branch Protection

Repository-ul are branch protection activat pe `main`. Toate modificările trebuie făcute pe feature branches:

```bash
# Creează un branch nou pentru feature
git checkout -b feat/nume-feature

# Make changes...
git add .
git commit -m "Descriere schimbare"
git push origin feat/nume-feature

# Creează PR către main
```

## Scripts de generare cristale

Proiectul include scripturi Python pentru generarea conținutului cristalelor:

```bash
# Generează toate fișierele MDX din crystal-data.json
python3 generate-crystals.py

# Sau folosește varianta simplifica (doar 8 cristale demo)
python3 generate_all.py
```

Fișierul `crystal-data.json` conține datele complete pentru toate cele 52 de cristale.

## Troubleshooting

### Build eșuează
- Verifică dacă ai rulat `npm install`
- Asigură-te că ai Node.js >= 24.0.0
- Run `npm run build` local pentru a vedea erorile

### Pagina de profil `/@username` întoarce 404
Cauza: deploy-ul publică doar assets statice, fără worker-ul SSR.

- Verifică local: `npm run build && npm run preview:pages`, apoi deschide `http://localhost:8788/@test`
- Verifică în dashboard: **Build output directory** = `dist/client`
- Verifică în log-ul de build că apare `[build] Cloudflare Pages worker prepared at dist/client/_worker.js`
- Verifică în Cloudflare Dashboard → Pages → Settings → Environment variables că `CLERK_SECRET_KEY` este setat
- Restartează build-ul manual din dashboard (Deployments → Retry deployment)

### Imaginile nu apar
- Verifică dacă imaginile sunt în `public/images/crystals/`
- Asigură-te că numele fișierelor corespund cu `image` din crystal-data.json

### Preview nu arată schimbările
- Rulează din nou `npm run build` înainte de `npm run preview`
