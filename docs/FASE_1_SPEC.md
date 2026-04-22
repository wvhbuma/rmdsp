# Fase 1 — Weekly Performance pagina + data-infrastructuur

**Scope:** Eén werkende data-pagina (Weekly Performance) met alle onderliggende
infrastructuur (TanStack Query, auth'd fetch, ECharts, period-picker, error
states, persistent filter state, hide/show per sectie). Dit is de pilot voor
alle volgende pagina's.

**Niet-scope:** Monthly Performance, Decision Support, Performance Analysis
(komen in Fase 2+). Widget drag-and-drop customization (komt beperkt in Fase 2+
voor Cockpit en Monthly, zie `docs/ARCHITECTURE_DECISIONS.md` decision 10).

**Duur:** Inschatting 4-6 werkdagen voor frontend, afhankelijk van backend-
beschikbaarheid.

---

## 1. Pre-requisites (Wolter + lead dev)

Deze moeten klaar zijn voordat Claude Code aan Fase 1 begint:

### Backend (lead dev)
- [ ] `GET /health` endpoint op RAM API (returns 200 OK met `{status, db, timestamp}`)
- [ ] CORS op RAM API toestaan voor `http://localhost:5173` en
      `https://salmon-desert-09cfbed03.7.azurestaticapps.net`
- [ ] (Parallel met frontend-bouw): `GET /Dsp/WeeklyPerformance` endpoint per
      spec in `RAM_API_Specification.md` sectie 4.1

### Auth-integratie (afspraak lead dev + Wolter)
- [ ] Beslissing: valideert RAM API MSAL bearer tokens, of blijft API key?
- Als bearer tokens: hoe registreren we API als resource in Entra? Welke scopes?
- Als API key: hoe leveren we die veilig aan de frontend zonder te exposen?
- Tussenoplossing voor Fase 1: **API key via environment variable**, bewust
  knowing dat dit tijdelijk is. Gedocumenteerd in ARCHITECTURE_DECISIONS.md.

### Frontend prep (Wolter, via Claude.ai)
- [ ] Mock data file gegenereerd voor Weekly Performance (zodat pagina-bouw
      niet afhankelijk is van backend-beschikbaarheid)
- [ ] Beslissing: ECharts of Recharts voor Weekly Performance charts?

---

## 2. Architectuur-beslissingen Fase 1

### 2.1 Data-fetching: TanStack Query
- Reden: industry standard, cache, stale-while-revalidate, automatic refetching
- Alternatief (useState + useEffect) werkt, maar leidt tot bugs bij refetching
  en duplicatie tussen pagina's
- Stale-time defaults:
  - KPI data: 5 minuten
  - Reference data (Cabins, Markets): 60 minuten
  - Health-check: 30 seconden

### 2.2 Fetch wrapper met auth
- Alle API-calls gaan via `src/api/client.ts`
- Wrapper voegt automatisch MSAL token toe als Authorization header (Fase 2+)
  of API key (Fase 1 tijdelijk)
- Centrale error-handling (401 → re-auth, 5xx → user-friendly melding)
- TypeScript types uit API-spec (handmatig of generated; voor nu handmatig)

### 2.3 Charts: Apache ECharts
- Bevestiging van Fase 0 decision
- Wrapper-component `<Chart>` die options object accepteert
- Herbruikbaar voor Weekly, Monthly, Curves, etc.

### 2.4 Period-picker (gedeelde component)
- `src/components/PeriodPicker.tsx`
- Route-filter + Cabin-filter in URL-params (niet state) zodat deelbare URLs werken
- Later uitgebreid met date-range picker voor Curves

### 2.5 Persistent filter state (NIEUW — stap 4a)
**Principe:** Filters worden bewaard zodat een gebruiker na navigatie of
browser-restart terugkeert in zijn laatst-gebruikte view.

**Architectuur (3-laags fallback):**
1. **URL-params** (hoogste prioriteit) — als aanwezig, gebruiken. Maakt URLs
   deelbaar en linkbaar.
2. **localStorage** (persistente fallback) — bewaart last-used filter per
   pagina onder key `ramdsp.filters.<pageKey>`.
3. **Default** (fallback) — hardcoded default per pagina (meestal "alle
   routes, alle cabins").

**Wijzigings-gedrag:**
- Bij filter-wijziging: update BEIDE URL-param en localStorage
- Bij navigatie weg + terug zonder URL-param: lees localStorage
- Bij browser restart + bookmark-URL met params: URL wint (logisch — de
  gebruiker heeft bewust die URL gebookmarkt)

**Generieke hook:** `src/hooks/usePersistentFilter.ts`
```ts
const [filter, setFilter] = usePersistentFilter('weekly', {
  route: null,
  cabin: null,
})
```

**Scope**: ALLE data-pagina's gebruiken deze hook (niet alleen Weekly).
Opzetten in Fase 1, meeliften op elke latere pagina.

**Niet binnen scope:** cross-device sync (zou backend user-preferences vereisen).

### 2.6 Hide/show per sectie (NIEUW — stap 7b)
**Principe:** Elke chart/tabel op een pagina kan door de gebruiker verborgen
worden. State per gebruiker in localStorage.

**UX-pattern:**
- Kleine X-icoon rechtsboven elk section-block (chart, tabel, KPI-rij)
- Klik → sectie verdwijnt met subtle fade
- Bovenaan pagina: "Verborgen secties (N)" dropdown om te herstellen
- Geen confirmation dialog — herstellen is triviaal

**localStorage key:** `ramdsp.hidden.<pageKey>` met array van section-IDs.

**Section registratie:** Elke section-container krijgt een stabiele `id` prop
(bv. "kpi-cards", "dow-chart", "top-movers"). De hook weet welke actief zijn
door de DOM-tree te inspecteren of via een registry.

**Implementatie:** `src/components/HideableSection.tsx` wrapper component.
```tsx
<HideableSection id="dow-chart" title="Bookings per Day of Week">
  <Chart options={dowOptions} />
</HideableSection>
```

**Scope Fase 1:** Alleen op Weekly Performance (als pattern-establisher).
Hergebruiken in latere pagina's waar opinionated.

**Niet binnen scope Fase 1:** drag-to-reorder, resize, widget-catalog (add new).
Dit is Fase 2+ voor Cockpit en Monthly specifiek (zie ADR 10).

### 2.7 Loading + error states (gedeelde componenten)
- `<LoadingSkeleton>` voor KPI-cards en tabellen
- `<ErrorCard>` met retry-button voor failed API calls
- Globale error boundary in App.tsx voor onverwachte crashes

### 2.8 Mock data strategie
- `src/mocks/weeklyPerformance.ts` exporteert sample response
- Env-var `VITE_USE_MOCKS=true` schakelt mock mode in
- Fetch wrapper check env-var en returnt mock ipv echte call
- Productie-deploy heeft `VITE_USE_MOCKS=false`

---

## 3. 9-stappen plan voor Claude Code

Elke stap levert een werkende staat op + een commit. Claude Code stopt na
elke stap voor Wolter's review.

### Stap 1: TanStack Query + fetch-wrapper foundation (~1 uur)
- Install `@tanstack/react-query`
- `src/api/client.ts`: fetch-wrapper met auth-header (tijdelijke API key),
  error-handling, TypeScript helpers
- `main.tsx`: QueryClientProvider toevoegen rond App
- `src/api/health.ts`: eerste `useQuery` hook voor `/health`
- Home.tsx: wire health-check naar echte API via TanStack Query
- Commit: "feat(step-1): TanStack Query + fetch wrapper + /health integratie"

### Stap 2: Mock data setup (~30 min)
- `src/mocks/weeklyPerformance.ts` met realistische sample data
- Env-var `VITE_USE_MOCKS` toevoegen aan config
- Fetch-wrapper: schakel naar mock als env-var `true`
- Documentatie in README over mock mode
- Commit: "feat(step-2): mock-data infrastructuur voor dev zonder backend"

### Stap 3: Weekly Performance data-layer (~1 uur)
- `src/api/weeklyPerformance.ts`: TypeScript types uit API-spec sectie 4.1
- `useWeeklyPerformance(route?, cabin?)` hook met TanStack Query
- Eerste rendering op WeeklyPerformance pagina: raw JSON uit hook naar
  een `<pre>` tag om data-flow te valideren
- Commit: "feat(step-3): Weekly Performance data hook met mock response"

### Stap 4: Period picker + shared components (~2 uur)
- `src/components/PeriodPicker.tsx`: route/cabin dropdowns
- `src/components/KPICard.tsx`: herbruikbare KPI weergave
- `src/components/LoadingSkeleton.tsx`: skeleton-UI
- `src/components/ErrorCard.tsx`: error state met retry
- URL-params sync (useSearchParams) voor filters
- Commit: "feat(step-4): shared PeriodPicker + KPI/Loading/Error components"

### Stap 4a: Persistent filter state (~1 uur) — NIEUW
- `src/hooks/usePersistentFilter.ts`: URL + localStorage + default fallback
- Refactor PeriodPicker om usePersistentFilter te gebruiken ipv losse URL-handling
- Test: filter zetten → navigeren weg → terug → filter nog steeds actief
- Test: filter zetten → browser restart → filter nog steeds actief
- Test: bookmarked URL met andere filter → overruled localStorage
- Commit: "feat(step-4a): persistent filter state via URL + localStorage"

### Stap 5: Weekly Performance KPI-sectie (~2 uur)
- 3x KPI-cards bovenaan: CW vs LW vs PY (Units, Revenue, Yield, Cap Index)
- Change indicators (groen/rood arrows, percentages)
- Period-picker integratie: wijziging triggert refetch
- Commit: "feat(step-5): Weekly Performance KPI-sectie met CW/LW/PY vergelijking"

### Stap 6: Weekly Performance charts (~3 uur)
- `src/components/Chart.tsx`: ECharts wrapper
- Day-of-Week bar chart (CW/LW/PY overlay)
- Revenue pace chart (CY vs PY_TD vs PY_Full per DepMonth)
- Channel breakdown (SalesSource)
- Commit: "feat(step-6): Weekly Performance charts (DOW, pace, channel)"

### Stap 7: Movers tabellen + polish (~2 uur)
- Top movers tabel (8 rijen, sorteerbaar)
- Slow movers tabel (8 rijen, filterable on LF/LTD)
- Responsive layout (desktop-first, check tablet)
- Polish: tooltips, hover states, subtle animations
- Commit: "feat(step-7): Movers tabellen + polish Weekly Performance"

### Stap 7b: Hide/show per sectie (~1.5 uur) — NIEUW
- `src/components/HideableSection.tsx` wrapper
- `src/hooks/useHiddenSections.ts` voor localStorage persist
- Wrap alle 6 secties op Weekly Performance in HideableSection met stabiele IDs:
  kpi-cards, dow-chart, channel-chart, pace-chart, top-movers, slow-movers
- "Verborgen secties (N)" dropdown bovenaan pagina om te herstellen
- Smooth fade-transitions (Tailwind transition classes)
- Commit: "feat(step-7b): hide/show sections met localStorage persistence"

### Stap 8: Integratie met echte backend (~1 uur, na backend klaar)
- Env-var flip: `VITE_USE_MOCKS=false` in productie
- Handmatige test tegen staging endpoint (ram-api-es-acc)
- Fix mismatches tussen mock data shape en echte API response
- End-to-end test: login → navigate to Weekly → data loads → filters → hide-show
- Commit: "feat(step-8): Weekly Performance integratie met RAM API live"

---

## 4. Definition of Done Fase 1

- [ ] Weekly Performance pagina toont echte data van ram-api-es-acc
- [ ] Route-filter en Cabin-filter werken, URL-shareable
- [ ] Filter-state blijft bewaard na navigatie en browser-restart (localStorage)
- [ ] Elke sectie op de pagina kan verborgen worden; herstel via dropdown
- [ ] Verborgen-staat blijft bewaard per gebruiker per browser (localStorage)
- [ ] KPIs, DOW-chart, pace-chart, channel-chart, movers-tabellen allemaal werkend
- [ ] Loading skeletons bij eerste load + bij filter-wijziging
- [ ] Error states bij 4xx/5xx API responses met retry-knop
- [ ] `/health` indicator op Home blijft groen
- [ ] Productie-deployment op SWA werkt met live backend
- [ ] Lead data scientist kan lokaal nieuwe feature toevoegen (bv. tekst-wijziging)
      en zien hoe dat live komt
- [ ] README uitgebreid met Fase 1 sectie: hoe data-layer werkt, hoe mocks toggle,
      hoe persistent state werkt
- [ ] ARCHITECTURE_DECISIONS.md aangevuld met Fase 1 beslissingen (incl. ADR 10)
- [ ] FASE_1_LESSONS.md geschreven (zoals Fase 0)

---

## 5. Verboden in Fase 1

Om scope-creep te voorkomen, expliciet NIET in Fase 1:

- Andere pagina's dan Weekly Performance inhoudelijk bouwen (Monthly, Decision
  Support, Performance Analysis, Cockpit — komen in Fase 2+)
- **Widget customization**: drag-and-drop posities, resize, add new widget.
  Dit is Fase 2+ en alleen voor Cockpit + Monthly (zie ADR 10).
- MSAL bearer token auth voor backend (Fase 2, nu API key tijdelijk)
- Admin/settings pagina's
- Export naar Excel/PDF
- Scheduled refresh, background jobs
- Mobile-responsive tuning (desktop-first; mobile in Fase 3 als überhaupt nodig)
- Donker thema / theming
- i18n (internationalisatie)
- Unit tests of E2E tests (komt in Fase 4 als quality-gate)
- Cross-device preference sync (vereist backend user-preferences tabel)
