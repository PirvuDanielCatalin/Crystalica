# Playwright Configuration

Acest director conține teste Playwright pentru Crystalica: autentificare, acțiuni pe pagini de profil, pagină de start, listarea cristalelor, detaliu cristal, navigare (404, RSS, chatbot).

## Setup

```bash
cd /home/daniel/Workdir/PersonalGithub/Crystalica
npm install --save-dev @playwright/test
npx playwright install chromium
```

## Rulare testele

```bash
# Toate testele Playwright
npm run test:playwright

# Doar un fișier specific
npx playwright test tests/playwright/homepage.spec.ts

# Doar teste autentificate
npx playwright test tests/playwright/profile-auth.spec.ts --project=chromium-auth

# Doar teste neautentificate
npx playwright test tests/playwright/profile-unauth.spec.ts --project=chromium-unauth

# Vizualizare raport
npx playwright show-report
```

## Fișiere de teste

| Fișier | Acoperă |
|--------|---------|
| `profile-auth.spec.ts` | Autentificat: buton de urmărire, tab-uri, acțiuni, contoruri, follow/unfollow |
| `profile-unauth.spec.ts` | Neautentificat: buton ascuns, acțiuni ascunse, tab-uri ascunse, contoruri de header |
| `homepage.spec.ts` | Pagina de start: titlu, buton "Explorează Cristalele", bara de căutare, scripturi Botpress |
| `crystals.spec.ts` | Listarea cristalelor: navigație A-Z, click → detaliu, buton scroll-to-top (stânga) |
| `navigation.spec.ts` | 404, RSS feed (`/rss.xml`), chatbot Botpress pe toate paginile |

## Fișiere excluși din Git

Următoarele nu sunt incluse în commit (sunt în `.gitignore`):
- `test-results/` — rezultatele rulărilor Playwright
- `playwright-report/` — raportul HTML al Playwright
- `tests/playwright/.auth/` — starea de autentificare (contine tokenuri Clerk)

## Liste de verificare manuală

Când faci modificări la paginile de profil, verifică:

### Utilizator neautentificat
- [ ] Visitează `/@danielcatalinpirvu` — buton de urmărire ascuns
- [ ] Cardurile de cristale sunt clicabile (navighează la detaliu)
- [ ] Acțiunile (mută/elimină) nu sunt vizibile
- [ ] Tab-urile Comunitate/Configurație ascunse
- [ ] Header-ul arată contorurile: portofoliu, listă de dorințe, urmărite, urmăritori

### Autentificat ca @test
- [ ] Visitează `/@test` — buton de urmărire ascuns
- [ ] Acțiunile (mută/elimină) vizibile pe cristalele proprii
- [ ] Tab-ul Portfolio funcționează
- [ ] Tab-urile Comunitate/Configurație vizibile (doar pe propriul profil)
- [ ] Visitează `/@danielcatalinpirvu` — buton de urmărire vizibil (contornat negru)
- [ ] Hover pe buton de urmărire: fundal verde, bife vizibilă
- [ ] Click follow: schimbă în "Deja urmăresc", fundal verde
- [ ] Hover când urmezi: text "Nu mai urmări", contorn negru
- [ ] Cardurile de cristale clicabile (navighează la detaliu)
- [ ] Acțiunile (mută/elimină) nu sunt vizibile pe profilul altcuiva

## Commit rules

Testele trebuie comise și ținute la curent cu modificările de cod. Rulează testele după fiecare modificare pentru a asigura funcționalitatea.
