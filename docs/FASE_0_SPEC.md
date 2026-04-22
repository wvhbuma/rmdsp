# Fase 0 — React Scaffolding Bouwspec

**Doel:** werkende React SPA-shell die live draait op Azure Static Web Apps, met volledige navigatiestructuur, design tokens uit DSP, authentication-gate via Entra External ID, en een connectivity-check naar RAM API.

**Scope:** foundation, geen features. 20 placeholder-pagina's. Geen charts, geen data, geen business logic.

**Geschatte tijd:** 4–5 werkdagen bij focus; 2–3 weken kalendertijd bij parallel-schema.

---

## Tech-stack (vastgesteld, niet ter discussie)

| Laag | Keuze |
|------|-------|
| Build tool | Vite latest + React 18+ + TypeScript 5+ |
| TS mode | strict + `noUnusedLocals` + `noUnusedParameters` + `noFallthroughCasesInSwitch` |
| Router | React Router v7, library mode, flatte URL's |
| State | `useState` + React Router `useSearchParams` — **niks extra's in deze fase** |
| Styling | Tailwind CSS v4 met ES-tokens in `tailwind.config.ts` |
| Charts | **Niet installeren in Fase 0** (Apache ECharts komt in Fase 1) |
| Auth | `@azure/msal-react` + `@azure/msal-browser` + Microsoft Entra External ID |
| Deployment | Azure Static Web Apps + GitHub Actions |

### Toegestane dependencies

Alleen bovenstaande. Als Claude Code voelt dat hij extra's nodig heeft (datepicker, icon-library, HTTP-client), eerst overleg met Wolter.

### Verboden dependencies in Fase 0

- Redux, Zustand, Jotai, MobX (state management)
- Recharts, Chart.js, Visx, ECharts (charts)
- Axios, Ky (HTTP — gebruik native `fetch`)
- Shadcn, Material UI, Chakra, Ant Design (component libraries)
- Moment, date-fns, dayjs (date libs — kunnen later)

---

## Repo-structuur (wat Claude Code moet opleveren)

```
ram-frontend/
├── CLAUDE.md                           # persistent context (al aanwezig)
├── README.md                           # setup-instructies voor nieuwe dev
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── index.html
├── .env.example                        # template, zonder geheimen
├── .gitignore
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml   # door Azure auto-gegenereerd, mogelijk aan te passen
├── docs/
│   ├── FASE_0_SPEC.md                  # dit bestand (al aanwezig)
│   ├── DESIGN_TOKENS.md                # al aanwezig
│   ├── NAV_STRUCTURE.md                # al aanwezig
│   └── SESSION_LOG.md                  # Claude Code houdt bij per sessie
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                        # entry point
│   ├── App.tsx                         # router setup
│   ├── config/
│   │   ├── env.ts                      # env-var lezer met type-safety
│   │   └── msal.ts                     # MSAL config (stap 5)
│   ├── layout/
│   │   ├── Layout.tsx                  # wrapper met Sidebar + Topbar + Outlet
│   │   ├── Sidebar.tsx                 # nav structuur
│   │   └── Topbar.tsx                  # paginatitel + user info
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── _placeholders/              # 19 placeholder-componenten
│   │       ├── FlightOverview.tsx
│   │       ├── Cockpit.tsx
│   │       ├── ... (17 meer)
│   │       └── ApprovalRules.tsx
│   ├── components/
│   │   └── ComingSoon.tsx              # shared placeholder-component
│   ├── auth/
│   │   ├── AuthGate.tsx                # wrapt Layout
│   │   └── useAuth.ts                  # hook voor user-info
│   └── styles/
│       └── globals.css                 # Tailwind imports + base styles
└── staticwebapp.config.json            # SWA routing/fallback config
```

---

## De 7 stappen

### Stap 1 — Repo setup + Azure deployment pipeline (0.5 dag)

**Doel:** commit één — "Hello RAM" pagina staat live op de SWA-URL.

**Deliverables:**
- [ ] Vite + React 18 + TypeScript scaffold (`npm create vite@latest . -- --template react-ts`)
- [ ] `tsconfig.json` met de 4 strictheid-flags (zie tech-stack)
- [ ] `package.json` met scripts: `dev`, `build`, `preview`, `type-check`, `lint`
- [ ] `.gitignore` (node_modules, dist, .env, .env.local)
- [ ] `.env.example` met placeholder-keys voor alle env-vars die straks nodig zijn
- [ ] `src/App.tsx` minimaal: `<h1>Hello RAM</h1>`
- [ ] `index.html` title: "RAM — European Sleeper"
- [ ] `staticwebapp.config.json` met `navigationFallback` naar `/index.html` (voor SPA-routing)
- [ ] GitHub Actions workflow aanwezig en groen (door Azure auto-gegenereerd bij SWA-aanmaak)
- [ ] SWA deployment succesvol — URL bekend en toegankelijk

**Acceptatie-criteria:**
- `npm run dev` draait lokaal op http://localhost:5173 zonder errors
- `npm run build` produceert een `dist/` folder zonder TS errors
- Push naar `main` triggert GitHub Actions die SWA deployed (controleerbaar in Actions-tab)
- De SWA-URL toont "Hello RAM" na deployment

**Wat NIET in deze stap:**
- Geen Tailwind (volgende stap)
- Geen router (stap 3)
- Geen auth (stap 5)
- Geen styling beyond het default

**Gotchas:**
- `staticwebapp.config.json` is essentieel voor client-side routing. Zonder dit bestand krijg je 404's als gebruikers direct op `/weekly` landen i.p.v. `/`.
- Vite's default dev-poort is 5173 — noteer voor redirect-URIs in Entra.

---

### Stap 2 — Tailwind CSS v4 + design tokens (0.5 dag)

**Doel:** Tailwind werkt, ES-brand tokens zijn beschikbaar als utility classes.

**Deliverables:**
- [ ] Tailwind v4 geïnstalleerd + PostCSS config
- [ ] `tailwind.config.ts` met ES-tokens (zie `docs/DESIGN_TOKENS.md`)
- [ ] `src/styles/globals.css` met `@tailwind base/components/utilities` + body-font + bg-color
- [ ] Google Fonts imports voor Red Hat Display + Lato in `index.html`
- [ ] `App.tsx` test toont: ES-blauw/magenta gradient heading "RAM" met Red Hat Display font + Lato body-tekst
- [ ] VS Code Tailwind IntelliSense werkt (autocomplete op `bg-es-blue` etc.)

**Acceptatie-criteria:**
- `<h1 className="text-es-blue font-display">` rendert in ES-blauw en Red Hat Display
- Lokaal én op SWA-URL identiek renderen
- `tailwind.config.ts` is de enige plek waar ES-tokens gedefinieerd zijn (geen magic numbers elders)

**Exacte tokens die in de config moeten:**

Zie `docs/DESIGN_TOKENS.md` voor de authoritatieve lijst. Verplichte kleuren: `es-blue`, `es-magenta`, `rm-gray`, `rm-gray-light`, `rm-dark`. Verplichte fonts: `display` (Red Hat Display), `body` (Lato). Verplichte spacing: `sidebar: '220px'`.

**Gotchas:**
- Tailwind v4 heeft **andere configuratie-syntax** dan v3 — geen `content` key meer, geen `theme.extend` op dezelfde manier. Check de actuele v4-docs.
- Google Fonts via `<link>` in `index.html` is simpeler dan via `@import` in CSS en voorkomt FOUC.

---

### Stap 3 — React Router v7 + Layout shell (1 dag)

**Doel:** sidebar met alle 20 nav-items is zichtbaar; klikken door werkt; URL updates.

**Deliverables:**
- [ ] `react-router-dom` v7 geïnstalleerd
- [ ] `src/App.tsx` met `<BrowserRouter>` + `<Routes>` voor alle 20 paden
- [ ] `src/layout/Layout.tsx` — Sidebar + Topbar + `<Outlet />`
- [ ] `src/layout/Sidebar.tsx` — alle 20 nav-items met exact de nesting-structuur uit `docs/NAV_STRUCTURE.md`
- [ ] `src/layout/Topbar.tsx` — toont paginatitel (af te leiden uit `useLocation` of een eigen map)
- [ ] `src/pages/Home.tsx` — simpele welkom-pagina in DSP-stijl (welkomtekst + logo-gradient circle uit DSP regel 2260-2265)
- [ ] `src/pages/_placeholders/*.tsx` — 19 placeholder-componenten, elk gebruikt `<ComingSoon feature="..." />`
- [ ] `src/components/ComingSoon.tsx` — herbruikbare placeholder
- [ ] SVG-icons uit DSP overgenomen in de Sidebar (zie RAM_DSP.py regels 2103-2248)

**Acceptatie-criteria:**
- Sidebar toont: Home + 4 parent-groepen, elk uit-/inklapbaar
- Business Overview heeft 2-level nesting (Performance/Customer/Operations/Market → leafs)
- `<NavLink>` toont actieve route in ES-blauw met rechts-rand (zie DSP `.nav-item.active`)
- Navigeren door alle 20 pagina's werkt: URL update, Topbar-titel update, `<Outlet />` toont juiste placeholder
- Direct op `http://localhost:5173/weekly` landen werkt (niet alleen via sidebar-klik)
- Op SWA-URL: direct op `https://.../weekly` landen werkt (hierom is `staticwebapp.config.json` uit stap 1 nodig)

**Route-naming conventie:**

Zie `docs/NAV_STRUCTURE.md` — gebruik exacte paths uit die tabel. Flatte URL's (`/weekly`, niet `/business-overview/performance/weekly`).

**Gotchas:**
- React Router v7 kan in "framework mode" of "library mode" draaien. **Wij gebruiken library mode** — geen file-based routing, geen loaders. Gewoon `<BrowserRouter>` + `<Routes>` + `<Route>`.
- `<NavLink>` heeft een ingebouwde `isActive`-prop voor conditional styling, gebruik die in plaats van zelf `useLocation` te matchen.
- Sidebar-state (welke groepen open zijn) is **lokale state in `<Sidebar />`**, niet global. Eén `useState<Set<string>>` voor alle open groepen.

---

### Stap 4 — Topbar + Home-page polish (0.5 dag)

**Doel:** de shell voelt professioneel, niet als een dev-scaffold.

**Deliverables:**
- [ ] Topbar toont: paginatitel links (uit route-map), huidige datum rechts
- [ ] Topbar heeft placeholder voor user-email (wordt ingevuld in stap 5)
- [ ] Home-pagina: welkom-circle met gradient, "European Sleeper Performance" heading, korte intro-tekst
- [ ] ComingSoon-component: centered, met DSP-stijl typografie en een kleine info-icon
- [ ] Sidebar-footer met versie of datum (uit DSP regel 2249: `__DATE_SHORT__`)
- [ ] Responsiveness: Topbar + Sidebar gedragen zich netjes op 1280px+ schermen (mobile responsive is Fase 6+ scope — nu niet)

**Acceptatie-criteria:**
- Shell ziet er visueel vergelijkbaar uit met DSP regels 1780-1810 (topbar) en 2253-2265 (home)
- Geen lege placeholders, geen `TODO` comments zichtbaar voor eindgebruiker
- Kleuren en fonts consistent met `tailwind.config.ts`

**Wat NIET in deze stap:**
- Geen mobile nav (hamburger menu) — later
- Geen dark mode — later
- Geen user-avatar (alleen email-text voor nu)

---

### Stap 5 — MSAL + Entra External ID auth (1 dag)

**Doel:** je moet inloggen voordat je de shell ziet.

**Deliverables:**
- [ ] `@azure/msal-react` + `@azure/msal-browser` geïnstalleerd
- [ ] `src/config/msal.ts` met config uit env-vars (tenant, clientId, authority, redirectUri)
- [ ] `src/main.tsx` wrapt `<App />` in `<MsalProvider>`
- [ ] `src/auth/AuthGate.tsx` — wrapt `<Layout />` met `<AuthenticatedTemplate>` + `<UnauthenticatedTemplate>`
- [ ] Unauthenticated → login-pagina met "Sign in with Microsoft / Google" buttons
- [ ] Authenticated → normale shell
- [ ] Topbar toont email van ingelogde user
- [ ] Logout-button in Topbar werkt

**Acceptatie-criteria:**
- In incognito: SWA-URL toont login-pagina, niet de shell
- Login-flow: klik login → redirect naar Entra → login met Google of Microsoft → terug naar SWA → shell zichtbaar
- Refresh pagina behoudt sessie (tokens worden gecached in sessionStorage)
- Logout-button logt uit en toont weer login-pagina
- Email in Topbar is correct en komt uit het ID-token claim

**Env-vars nodig:**
```
VITE_ENTRA_TENANT_NAME
VITE_ENTRA_CLIENT_ID
VITE_ENTRA_AUTHORITY_URL
VITE_ENTRA_USER_FLOW
```

Vul deze in `.env.local` (lokaal, gitignored) en in de SWA-config (Azure Portal).

**Gotchas:**
- MSAL v3+ vereist `@azure/msal-browser` als peer dep; laat Claude Code de actuele versies checken.
- React 18 StrictMode kan MSAL dubbele init's triggeren in dev — gebruik de officiële Microsoft sample als referentie, niet random Stack Overflow antwoorden.
- Redirect-URI in Entra moet **exact** matchen (inclusief trailing slash of niet). Configureer zowel `http://localhost:5173` als de SWA-URL.
- Voor Fase 0 geen token-attachment aan API-calls — dat komt pas in Fase 1.

---

### Stap 6 — `/health` connectivity check (0.5 dag)

**Doel:** de React-app kan praten met RAM API. Groen vinkje als reachable.

**Deliverables:**
- [ ] `src/config/env.ts` exposes `RAM_API_BASE_URL` type-safe
- [ ] Home-pagina heeft onder het welkom-blok een kleine "System status" kaart
- [ ] Die kaart doet een `fetch` naar `${RAM_API_BASE_URL}/health` bij mount
- [ ] Groen bolletje + "API reachable" bij success (200)
- [ ] Rood bolletje + error-melding bij fail (network error, non-200)
- [ ] Loading-state met spinner tijdens fetch

**Acceptatie-criteria:**
- Groen indicator als lead dev de `/health` endpoint beschikbaar heeft
- Rood indicator + nuttige melding als endpoint unreachable
- Geen console-errors bij success-case
- CORS-fouten worden netjes opgevangen (niet als cryptic error)

**Env-vars nodig:**
```
VITE_RAM_API_BASE_URL=https://ram-api-es-prd.azurewebsites.net
```

**Wat NIET in deze stap:**
- Geen auth-headers op `/health` (health moet anonymous zijn of met test-apiKey)
- Geen TanStack Query — plain `useEffect` + `fetch` voor nu (TQ komt Fase 1)
- Geen retry-logic, geen polling — éénmalige check bij mount

**Gotchas:**
- Als de endpoint nog niet bestaat, is rood-indicator de correcte gedraging. Niet de feature skippen.
- CORS: als je een CORS-error krijgt, is het backend-werk van lead dev, niet frontend-bug.

---

### Stap 7 — Documentatie + wrap-up (0.5 dag)

**Doel:** een nieuwe developer kan de repo klonen en binnen 30 minuten lokaal draaien.

**Deliverables:**
- [ ] `README.md` met secties:
  - Project overview (2 zinnen)
  - Prerequisites (Node.js versie, npm)
  - Setup (clone, install, env-vars kopiëren uit `.env.example`, `npm run dev`)
  - Commands (dev, build, preview, lint, type-check)
  - Deployment (hoe push naar `main` = deploy)
  - Contributing (kleine checklist: type-check passes, lint passes, commit-message-conventie)
- [ ] `.env.example` compleet met alle env-vars (zonder echte waarden)
- [ ] `docs/SESSION_LOG.md` met korte log van de 7 Claude Code stappen en hun uitkomst
- [ ] `docs/ARCHITECTURE_DECISIONS.md` met de 8 architectuur-keuzes uit de Claude.ai-sessie als ADR-format
- [ ] Optioneel: `CONTRIBUTING.md` met code-standaarden

**Acceptatie-criteria:**
- Iemand anders dan Wolter kan de repo klonen en `npm install && npm run dev` zonder vragen
- Alle 8 architectuur-keuzes zijn gedocumenteerd met redenering
- SESSION_LOG bevat per stap: datum, wat gedaan, issues, oplossingen

---

## Definition of Done voor Fase 0

De fase is af als al het volgende waar is:

1. Shell draait live op Azure Static Web Apps URL
2. Login via Entra External ID (Google OF Microsoft) werkt end-to-end
3. Alle 20 routes zijn bereikbaar en tonen `<ComingSoon />`
4. Nav-structuur matcht exact de DSP-hiërarchie (4 parents, 2-level nesting bij BO)
5. Design tokens uit DSP zijn gereproduceerd (ES-blauw, magenta, fonts)
6. `/health` connectivity check werkt (groen of rood, maar functioneel)
7. GitHub Actions pipeline deployt bij elke push naar `main`
8. `npm run build` en `npm run type-check` passen zonder errors of warnings
9. README is compleet genoeg voor onboarding
10. Wolter begrijpt de codebase en kan er zelfstandig kleine wijzigingen in maken

## Wat Fase 0 expliciet NIET oplevert

- Echte data-visualisatie (Fase 1)
- Weekly/Monthly/Decision Support pagina-inhoud (Fase 1)
- TanStack Query (Fase 1)
- ECharts (Fase 1)
- Role-based access (Fase 5)
- Mobile responsive (Fase 6+)
- Dark mode (Fase 6+)
- Multi-language support (buiten scope)
- Performance optimalisaties (Fase 6+)

Als iets van bovenstaande in een Claude Code suggestie opduikt: terug naar de spec, niet bouwen.
