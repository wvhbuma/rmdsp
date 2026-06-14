# RAM Frontend — Claude Code Context

React scaffolding voor RAM (Revenue Automation & Management) — Revenue Management systeem voor European Sleeper. Dit is Fase 0 van een 7-fasen migratie van het Python DSP-prototype naar een productie-React-frontend.

## Werktaal

**Nederlands.** Wolter is Nederlandstalig, Python-expert, Revenue Management specialist, React-beginner. Leg concepten kort uit bij eerste gebruik.

## Tech-stack (vastgesteld — niet ter discussie)

- **Build:** Vite + React 18+ + TypeScript 5+
- **TS flags:** `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **Router:** React Router v7 in library mode (niet framework mode)
- **State:** `useState` + `useSearchParams`. Geen Redux, Zustand, Context voor Fase 0.
- **Styling:** Tailwind CSS v4. ES-brand tokens in `tailwind.config.ts`.
- **Auth:** `@azure/msal-react` + Microsoft Entra External ID
- **Deployment:** Azure Static Web Apps + GitHub Actions

**Verboden in Fase 0:** charts (Chart.js, Recharts, ECharts komen Fase 1), HTTP clients (gebruik native `fetch`), component libraries (geen shadcn/MUI/Chakra), date libs.

## Werkwijze met Wolter

- **Eén stap per keer** uit `docs/FASE_0_SPEC.md`. Vraag akkoord tussen stappen.
- **Geen scope creep.** Features, charts, data-fetching = Fase 1+. Noteer suggesties in `docs/FASE_1_BACKLOG.md`.
- **Commit per stap** met duidelijke message (`feat(step-N): ...`).
- **Dependencies alleen uit de toegestane lijst.** Overleg voor uitbreiding.
- **Bij twijfel over scope:** FASE_0_SPEC.md is authoritatief.

## Authoritative documenten in deze repo

Lees bij start van elke sessie in deze volgorde:
1. Deze `CLAUDE.md` (persistent context)
2. `docs/FASE_0_SPEC.md` (wat moet er gebouwd worden)
3. `docs/SESSION_LOG.md` (waar zijn we gebleven)
4. `docs/DESIGN_TOKENS.md` (ES-brand tokens — bij styling-werk)
5. `docs/NAV_STRUCTURE.md` (20 routes — bij routing/sidebar-werk)

## Code-conventies

- **Geen `any`-types** zonder comment met reden.
- **Imports:** absolute paths via `@/` alias (configureer in `vite.config.ts` en `tsconfig.json`).
- **Bestandsnamen:** components PascalCase (`Sidebar.tsx`), hooks camelCase met `use` prefix (`useAuth.ts`), utils camelCase.
- **Geen default exports** voor components, behalve waar een library het vereist (lazy loading).
- **Eén component per bestand.** Kleine sub-components kunnen in hetzelfde bestand als ze privé zijn.
- **Geen inline styling** (`style={{...}}`). Gebruik Tailwind utilities of CSS custom properties.
- **ESLint + Prettier** actief. Formatteer voor elke commit.

## Environment variables

Alle env-vars prefix `VITE_` (anders exposure Vite ze niet aan de browser).

```
# .env.example (dit committen)
VITE_ENTRA_TENANT_NAME=
VITE_ENTRA_CLIENT_ID=
VITE_ENTRA_AUTHORITY_URL=
VITE_ENTRA_USER_FLOW=
VITE_RAM_API_BASE_URL=
```

`.env.local` met echte waarden staat in `.gitignore` — NOOIT committen.

## Infrastructuur-waarden (Wolter vult in — placeholders hieronder)

```
# Azure
AZURE_RESOURCE_GROUP= ram-rg-rm-tst
AZURE_SWA_NAME= swa-rmdsp-tst
AZURE_SWA_URL= https://salmon-desert-09cfbed03.7.azurestaticapps.net

# GitHub
GITHUB_REPO= wvhbuma/rmdsp

# Entra External ID
ENTRA_TENANT_NAME=rmdsptst.onmicrosoft.com
ENTRA_TENANT_ID=7f0329b6-50e0-4856-ba05-0387348a4218
ENTRA_AUTHORITY_URL=https://rmdsptst.ciamlogin.com/rmdsptst.onmicrosoft.com
ENTRA_CLIENT_ID= 53ab06b5-a9d9-45ed-bd23-700d03f21400
ENTRA_USER_FLOW=signupsignin

# RAM API
RAM_API_BASE_URL=https://ram-api-es-acc.azurewebsites.net
RAM_API_HEALTH_ENDPOINT=/health
```

## Gotchas uit eerdere sessies

**Dev auth bypass:**
- `VITE_DEV_NO_AUTH=true` slaat `AuthGate` over in dev (voor visuele tests van
  v2-pagina's zonder live Entra-sessie). **NOOIT** in productie of CI zetten —
  Vite bakt env-vars build-time in, dus een prod-build met deze vlaag = geen auth.

**React Router v7:**
- Library mode gebruiken, niet framework mode. Geen `loader`-functies.
- `<NavLink>` heeft ingebouwde `isActive` — gebruik dat, niet `useLocation` matching.

**MSAL + React 18:**
- StrictMode kan dubbele init triggeren. Gebruik officiële Microsoft sample als referentie.
- Redirect-URI in Entra moet exact matchen (inclusief / of niet).
- Volg docs.microsoft.com, niet Stack Overflow antwoorden van 2022.

**Tailwind v4:**
- Config-syntax verschilt van v3. Check actuele v4-docs.
- Geen `content` key meer, andere `theme` structuur.

**Azure Static Web Apps:**
- `staticwebapp.config.json` met `navigationFallback` is vereist voor SPA-routing.
- Zonder dat bestand: 404 bij direct landen op `/weekly`.
- Built-in SWA auth gebruiken we **niet** — we gebruiken MSAL direct.

**Vite:**
- Default dev-poort 5173. Vermeld in Entra redirect-URIs.
- Env-vars moeten `VITE_` prefix hebben om exposed te worden.

**Python-achtergrond Wolter:**
- Bij concepten die afwijken van Python (hoisting, async, closures, JSX-reactivity), benoem ze even in 1 zin.
- Geen tutorials, wel korte context.

## Wat Claude Code NIET mag doen zonder overleg

- Architectuur-keuzes uit deze file wijzigen
- Nieuwe dependencies toevoegen buiten de toegestane lijst
- Bestanden buiten `ram-frontend/` aanraken (DSP.py, Python engine — separate repo)
- Scope uitbreiden naar Fase 1+ features
- Tests/CI-configuratie toevoegen die niet in FASE_0_SPEC.md staat
- "Verbeteringen" aan de spec zelf

## Einde van elke sessie

1. Update `docs/SESSION_LOG.md` met: datum, welke stap gedaan, issues, volgende stap
2. Commit + push
3. Claim niet dat iets "klaar" is als Wolter het nog niet heeft getest

## Deployment & CI/CD gotchas

### GitHub Secrets: Repository vs Environment
- Secrets MOETEN Repository secrets zijn, niet Environment secrets.
- GitHub's UI is misleidend: de knop "New secret" maakt Environment secrets als je
  in een Environment-view zit. Dit gebeurt ook zonder dat je bewust een Environment
  aanmaakt.
- Symptoom bij fout: build slaagt zonder env-block in logs, Vite bakt lege strings
  in, app toont ConfigError-pagina.
- Check: GitHub repo → Settings → Secrets and variables → Actions → sectie moet
  "Repository secrets" heten, niet "Environment secrets".
- Fix: verwijder Environment secrets + Environment zelf, maak opnieuw aan als
  Repository secret.

### Azure SWA + Vite build: Oryx bypass verplicht
- Azure Static Web Apps gebruikt standaard Oryx als builder. Oryx draait in een
  aparte container en ERFT GEEN env-vars van de GitHub Actions runner.
- Dit betekent: VITE_* env-vars op de `Azure/static-web-apps-deploy@v1` step
  komen NIET bij Vite tijdens de build.
- Oplossing (permanent in onze workflow): we skippen Oryx met `skip_app_build: true`
  en doen `npm run build` als expliciete GitHub Actions step vóór de deploy-action.
- Zie `.github/workflows/azure-static-web-apps-salmon-desert-09cfbed03.yml` voor
  de werkende setup.
- Dit is een bekende en veelvoorkomende SWA-bug met Vite/Next.js apps. Niet
  optimaliseren of "vereenvoudigen" zonder te begrijpen waarom de split-build er is.

### Microsoft Entra External ID: aanmaken via entra.microsoft.com
- External tenants kunnen NIET worden aangemaakt via portal.azure.com.
- Gebruik entra.microsoft.com → Entra ID → Manage tenants → Create → External.
- De pagina "External Identities" in portal.azure.com is iets ANDERS: dat is
  B2B Collaboration voor guest users in je workforce tenant. Niet voor CIAM.
- External tenant moet in een NIEUWE resource group (conflict met workforce-
  tenant RG). Beste naam: `rg-<project>-externalid-<env>`.

### Workflow triggering: PR merge vs direct push
- SWA deploy-workflow triggert alleen op push/PR naar `main`.
- Feature-branch pushes triggeren GEEN productie-deploy (wel een eventuele
  PR-preview-deploy als die geconfigureerd is).
- Om een deploy te forceren zonder inhoudelijke wijziging:
  `git commit --allow-empty -m "trigger: re-run deploy" && git push`
- De "Close Pull Request Job" die na een merge loodt met rood: die mag falen,
  dat is de preview-cleanup die bij een lege preview niet werkt.

### De drie Vite env-var valkuilen
1. Prefix MOET `VITE_` zijn. Vite exposeert alleen variabelen met die prefix
   aan client-side code.
2. Env-vars worden BUILD-TIME ingebakken, niet runtime. Betekent:
   - Azure Portal → SWA → "Application Settings" heeft GEEN EFFECT op onze app
   - Wijziging van een secret vereist een nieuwe build om door te komen
3. In code gebruik je `import.meta.env.VITE_X`, nooit `process.env.VITE_X`
   (dat laatste werkt in Node, niet in Vite-builds).

### MSAL + Entra redirect URIs
- Elke dev-omgeving (localhost:5173) EN elke deployed URL (SWA) moet EXACT
  geregistreerd staan in App Registration → Authentication → Single-page application.
- Geen trailing slash. Case-sensitive. Protocol (http/https) moet matchen.
- Poort-conflict: als 5173 bezet is schakelt Vite naar 5174. Dan klopt de
  redirect URI niet meer. Fix: `kill $(lsof -t -i:5173)` voor je `npm run dev` draait.

### End-to-end Claude Code workflow (standaard volgorde)
Na elke Claude Code stap die pushed wordt lokaal:
```bash
git pull
npm install   # alleen als package.json is gewijzigd in de commit
npm run dev
```
Vergeet nooit `npm install` als er een nieuwe dependency is toegevoegd (symptoom:
onverklaarbare import-errors in dev-server).

### Git: Claude Code en Wolter parallel
- Claude Code werkt op feature-branch, Wolter doet PRs + merges in GitHub UI.
- Als Wolter lokaal commits maakt terwijl Claude Code ook pushed: `git pull --rebase`
  voordat je `git push`. Bij conflicts: STOP en overleg, niet zelf fixen.
- `package-lock.json` wijzigingen zijn normaal na `npm install` en moeten WEL
  gecommit (anders krijgen team-members "werkt op mijn machine" bugs).

## Fase 1 context (vanaf april 2026)

### Scope
Weekly Performance pagina + data-infrastructuur (TanStack Query, ECharts,
period-picker, mock data, persistent filter state, hide/show per sectie).
Geen Monthly/Curves/Decision Support in Fase 1.

### Huidige bouwstaat
Na Fase 0:
- React shell draait op Azure SWA met Entra auth
- 20 routes met ComingSoon-placeholders
- `/health` check mechanisme klaar (wacht op backend endpoint)
- Geen data-fetching library, geen charts, geen echte content

### Verboden in Fase 1 (scope-guard)
- Andere pagina's dan Weekly Performance inhoudelijk bouwen
- MSAL bearer token validatie op backend (gebruik API key tijdelijk)
- **Widget drag-and-drop / resize / add-widget** (komt in Fase 2+, alleen voor
  Cockpit en Monthly — zie ADR 10)
- Unit/E2E tests (komt in Fase 4)
- Mobile-responsive tuning (desktop-first)
- Dark mode, theming, i18n
- Cross-device preference sync (vereist backend user-preferences)

### Nieuwe env-vars Fase 1
```
VITE_RAM_API_KEY=<key>         # Tijdelijke API key auth (Fase 2: vervangen door bearer tokens)
VITE_USE_MOCKS=true|false      # Toggle mock-data vs echte API
```

Zoals gebruikelijk: zowel in `.env.example`, `.env.local`, GitHub Repository
Secrets, én in deze CLAUDE.md documenteren.

### UX-architectuur: Dashboard vs Werkbank

Zie ADR 10 in `docs/ARCHITECTURE_DECISIONS.md` voor context. Voor Claude Code:

**Dashboard-pagina's (90% van pagina's, inclusief Weekly Performance):**
- Opinionated layout — secties in vaste volgorde, bepaald door RM-expertise
- User kan secties alleen hide/show (geen drag, geen resize, geen add)
- Pattern: wrap elk section-block in `<HideableSection id="..." title="...">`
- State: localStorage key `ramdsp.hidden.<pageKey>`

**Werkbank-pagina's (Monthly, Cockpit — komen in Fase 2+):**
- Customizable layout — grid-based, drag-and-drop, resize, widget-catalog
- State: localStorage (Fase 2), user-preferences-tabel (Fase 3+)
- Library: react-grid-layout
- NIET bouwen in Fase 1

Bij bouw van een nieuwe pagina (Fase 2+): check ADR 10 voor classificatie
vóór je begint. Als Classification onduidelijk: stop, vraag Wolter.

### Persistent state architectuur

**Filter state (alle pagina's met filters):**
```
1. URL-params (hoogste prio)    → deelbare URLs
2. localStorage (persistente)   → overleven sessie + browser restart
3. Default (fallback)            → hardcoded per pagina
```
- Hook: `usePersistentFilter(pageKey, defaultValue)`
- Bij wijziging: update BEIDE URL en localStorage
- Bij navigatie: URL-param wint als aanwezig

**Hidden sections (Dashboard-pagina's):**
- Hook: `useHiddenSections(pageKey)`
- Array van section-IDs in localStorage
- Herstel via dropdown bovenaan pagina

**Widget layout (Werkbank-pagina's, Fase 2+):**
- Grid-positions per widget in localStorage
- Add/remove widgets uit widget-catalog
- Dit bouwen we NIET in Fase 1

### Data-flow architectuur Fase 1

```
User ─── PeriodPicker (route+cabin) ─── usePersistentFilter hook
                                         │        │
                                         ▼        ▼
                                    URL-params  localStorage
                                         │
                                         ▼
WeeklyPerformance.tsx ──── useWeeklyPerformance(route, cabin) hook
                                              │
                                              ▼
                                 TanStack Query cache
                                              │
                               ┌──────────────┴──────────────┐
                               │ VITE_USE_MOCKS=true?        │
                               │                              │
                  ┌─── yes ────┘                └──── no ────┐
                  ▼                                          ▼
        src/mocks/weeklyPerformance.ts          src/api/client.ts
        (static response + 300ms delay)         (fetch met auth header)
                                                       │
                                                       ▼
                                      ram-api-es-acc.azurewebsites.net
                                              /Dsp/WeeklyPerformance
```

### File-layout Fase 1 (plannen)

```
src/
├── api/
│   ├── client.ts                 # Fetch wrapper met auth + error handling
│   ├── health.ts                 # useHealthCheck() hook
│   └── weeklyPerformance.ts      # useWeeklyPerformance() + types
├── mocks/
│   └── weeklyPerformance.ts      # Static sample response
├── hooks/
│   ├── usePersistentFilter.ts    # URL + localStorage + default (Stap 4a)
│   └── useHiddenSections.ts      # localStorage array van hidden IDs (Stap 7b)
├── components/
│   ├── Chart.tsx                 # ECharts wrapper
│   ├── KPICard.tsx               # Single KPI met change indicator
│   ├── PeriodPicker.tsx          # Route + Cabin filters
│   ├── LoadingSkeleton.tsx       # Loading states
│   ├── ErrorCard.tsx             # API error states
│   └── HideableSection.tsx       # Wrapper voor hide/show per sectie
├── pages/
│   └── WeeklyPerformance.tsx     # Volledige pagina (replaces _placeholders/)
└── config/
    └── env.ts                    # +VITE_USE_MOCKS, +VITE_RAM_API_KEY
```

### Nieuwe npm dependencies Fase 1
- `@tanstack/react-query` (v5.x) — server-state management
- `echarts` + `echarts-for-react` — charts

(Geen date-lib, geen HTTP-client lib, GEEN react-grid-layout — native fetch
blijft, grid-layout komt pas Fase 2+.)

### Testing strategie Fase 1
- **Claude Code:** draait `tsc -b` + `npm run build` vóór elke commit
- **Wolter:** handmatig testen na elke pulled stap
- **Geen automated tests** — komt in Fase 4

### Wat Claude Code NIET mag doen in Fase 1

Naast de standaard-beperkingen uit Fase 0, specifiek Fase 1:

1. **Monthly/Curves/Decision Support pagina's aanraken.** Niet "alvast
   voorbereiden" of "generieker maken". Focus op Weekly.

2. **Widget-infrastructure voorbereiden.** Niet react-grid-layout installeren,
   niet abstraheren voor toekomstige widgets. Hide/show is FASE 1, widgets
   zijn FASE 2+. Niet vermengen.

3. **TanStack Query config fundamenteel wijzigen na stap 1.** Als de
   foundation staat, bouwen we er op. Geen "laten we de cache-strategie
   herzien" tijdens latere stappen.

4. **Backend code aanpassen.** Als een mismatch tussen mock en echte API
   optreedt: óf mock aanpassen (meestal), óf Wolter vragen de backend met
   lead dev bij te werken.

5. **Eigen component-library ontwerpen.** Gebruik de 6 gedeelde components
   uit de plannen (KPICard, Chart, PeriodPicker, LoadingSkeleton, ErrorCard,
   HideableSection). Niet uitbreiden tot "dashboard framework".

### Fase 1 gotchas vooraf (preventief)

**TanStack Query hydration:** bij SSR zou je moeten hydraten. Wij hebben geen
SSR (we draaien puur client-side), dus dit is geen issue. Negeer tutorials die
over hydration praten.

**TanStack Query v5 breaking changes vs v4:** `useQuery` API is anders
(object-syntax verplicht, geen positional args meer). Gebruik v5 docs.

**ECharts bundle-size:** het is een grote library (~700KB). Import alleen
wat je gebruikt:
```ts
import { init } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
// etc, per chart-type
```

**URL-param types:** useSearchParams geeft string | null, je moet zelf
valideren + parsen. Overweeg een typed wrapper of gewoon defensive code.

**Fetch wrapper + TanStack Query:** TanStack's `queryFn` wil een function
die returnt of throws. Fetch returns een Response object dat NIET throws bij
4xx/5xx. Je moet dat in de wrapper opvangen (`response.ok` check).

**localStorage + SSR:** localStorage bestaat niet tijdens server-side render.
Wij hebben geen SSR dus safe, maar als we ooit SSR toevoegen: eerst check
`typeof window !== 'undefined'` in de hooks.

**localStorage quota:** ~5MB per origin. Ruim meer dan genoeg voor filters
en hidden-section arrays. Geen zorgen voor Fase 1.

**HideableSection performance:** een verborgen sectie MAG niet ge-unmount
worden als de data al geladen is (dat zou de TanStack Query cache verliezen
en bij herstel opnieuw laden). Gebruik `display: none` via Tailwind `hidden`
class, niet conditional rendering met `&&`.
