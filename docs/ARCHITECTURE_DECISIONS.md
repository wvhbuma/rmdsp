# Architecture Decision Records (ADR)

De 8 fundamentele architectuur-keuzes voor RAM Fase 0. Elke ADR is in
**Michael Nygard-format**: Context → Decision → Consequences. Status: alle
geaccepteerd tijdens de Claude.ai-design-sessie voorafgaand aan Fase 0.

Volgorde reflecteert de stack van onder naar boven (build → runtime → UX).

---

## ADR-001 · Build tool: Vite + React 18 + TypeScript

**Status:** Accepted

**Context:**
We moeten een moderne SPA bouwen. Opties: Create React App (CRA, deprecated),
Next.js (framework met SSR/SSG), Vite (bundler zonder framework-opinie),
Remix/React Router framework-mode. Geen SSR-vereisten in Fase 0 — alle views
zijn authenticated dashboards, geen SEO-case.

**Decision:**
**Vite** (bundler), **React 18+** (UI-library), **TypeScript 5+** (typing).
Geen Next.js/Remix.

**Consequences:**
- ✅ Snelle dev-server (ESM native, geen bundling tijdens dev)
- ✅ Geen framework-lock-in; we kiezen zelf router, state, styling
- ✅ TypeScript compile-time guarantees voor een team met één Python-senior die
  React leert — compiler vangt wat tests nog niet dekken
- ❌ Geen built-in SSR (niet nodig in Fase 0, wel mogelijk in Fase N via Vite
  SSR als het ooit moet)
- ❌ Zelf router/state/styling kiezen = meer architectuur-beslissingen vooraf
  (maar dat is exact wat deze ADRs vastleggen)

---

## ADR-002 · Router: React Router v7 in library mode

**Status:** Accepted

**Context:**
React Router v7 kan in twee modi draaien: **framework mode** (file-based
routing, loaders, actions, SSR-hooks — vergelijkbaar met Next.js app router)
of **library mode** (klassieke `<BrowserRouter>` + `<Routes>` + `<Route>`,
geen magic).

**Decision:**
**Library mode.** 20 statische routes in `src/App.tsx`, flatte URL's (`/weekly`
i.p.v. `/business-overview/performance/weekly`).

**Consequences:**
- ✅ Geen file-based routing-conventie nodig; een Python-dev herkent
  de structuur direct
- ✅ Simpele mental model: één central route-tabel in `App.tsx`
- ✅ Flatte URL's delen makkelijker (kortere links)
- ❌ Geen route-level data-loading hooks (`loader`); we gebruiken `useEffect`
  + `fetch` of straks TanStack Query
- ❌ Geen automatische code-splitting per route (kan handmatig via
  `React.lazy` in Fase 6+)

---

## ADR-003 · State: useState + useSearchParams (geen extern store)

**Status:** Accepted

**Context:**
React apps hebben vaak global state (Redux, Zustand, Jotai, Context). Voor een
scaffolding-fase met 20 placeholders is dat overkill.

**Decision:**
**Alleen `useState` + React Router `useSearchParams`** in Fase 0. Geen Redux,
Zustand, Jotai, Context-based stores.

**Consequences:**
- ✅ Minimale dependencies, minimale mental overhead
- ✅ State lives close to waar hij gebruikt wordt (bv. Sidebar-expand-state
  binnen `Sidebar.tsx`)
- ✅ `useSearchParams` shareable via URL (filters, datumrange in Fase 1+)
- ❌ Als Fase 1 cross-component state nodig heeft (bv. globale filter), moeten
  we herevalueren — `useContext` kan waarschijnlijk volstaan, anders Zustand

---

## ADR-004 · Styling: Tailwind CSS v4 met @theme-tokens (CSS-first)

**Status:** Accepted

**Context:**
Styling-opties: CSS Modules, Styled Components, Emotion, Tailwind (v3 vs v4),
vanilla CSS met custom properties. ES-brand heeft concrete tokens (kleuren,
fonts) die consistent moeten zijn. DSP-prototype in Python gebruikt eigen
CSS-strings — die patronen willen we niet herhalen.

**Decision:**
**Tailwind CSS v4**, tokens gedeclareerd via `@theme { --color-es-blue: ... }`
in `src/styles/globals.css`. Geen `tailwind.config.ts` (in v4 optioneel).

**Consequences:**
- ✅ Utility classes = vrijwel geen aparte CSS-bestanden per component
- ✅ Eén bron van tokens (de `@theme` block) — verandering daar propageert naar
  alle components
- ✅ v4 Vite plugin = geen PostCSS-config
- ❌ Tailwind v4 is relatief nieuw (eind 2024); niet alle voorbeelden online
  zijn v4-compatible. Eigen judgement nodig bij nieuwe features.
- ❌ Tailwind-klasse-strings in JSX kunnen lang worden. Mitigatie: kleine
  sub-components extraheren in hetzelfde bestand (zie `Sidebar.tsx` met
  `GroupHeader`, `LeafLink`).

---

## ADR-005 · Auth: MSAL direct (niet SWA built-in auth)

**Status:** Accepted (implementatie in stap 5, geparkeerd)

**Context:**
Azure Static Web Apps heeft een ingebouwde auth-functie (`/.auth/login/aad`)
die gratis authenticatie biedt tegen Microsoft/Google zonder client-side code.
Alternatief: `@azure/msal-react` direct integreren tegen Microsoft Entra
External ID.

**Decision:**
**MSAL direct** via `@azure/msal-react` + `@azure/msal-browser`, tegen Entra
External ID (B2C-tenant `revenuemindz.ciamlogin.com` o.i.d.).

**Consequences:**
- ✅ Volledige controle over de auth-flow, token-claims, en redirect-UX
- ✅ Access tokens voor RAM API beschikbaar in Fase 1 (SWA built-in geeft alleen
  principal-info, geen API-tokens)
- ✅ User-flow (B2C_1_signupsignin) definieert welke IdP's (Microsoft, Google,
  email-password) beschikbaar zijn
- ❌ Meer configuratie: redirect-URI's moeten exact matchen in Entra portal
  voor zowel `http://localhost:5173` als SWA-URL
- ❌ MSAL v3+ + React 18 StrictMode kan dubbele init's triggeren — vereist
  officiële Microsoft sample als referentie

---

## ADR-006 · HTTP: native fetch (geen axios/ky)

**Status:** Accepted

**Context:**
HTTP-call opties: native `fetch` (browser-standaard), `axios` (feature-rijk),
`ky` (moderne fetch-wrapper).

**Decision:**
**Native `fetch`** in Fase 0. Mogelijk TanStack Query in Fase 1 voor caching
en error/retry-handling.

**Consequences:**
- ✅ Zero dependencies voor HTTP
- ✅ `AbortController` is native ondersteund (cleanup in `useEffect`)
- ✅ Moderne browsers hebben alles wat we nodig hebben (SWA users zitten niet
  op IE11)
- ❌ Geen auto-retry, geen interceptors — allebei niet nodig in Fase 0
  (eenmalige `/health`-call); TanStack Query lost dit op in Fase 1
- ❌ Fetch geeft géén rejecties bij 4xx/5xx — alleen bij network-errors. We
  moeten expliciet `res.ok` checken (zie `SystemStatus.tsx`)

---

## ADR-007 · Deployment: Azure Static Web Apps + GitHub Actions

**Status:** Accepted

**Context:**
Deployment-opties: Azure SWA, Vercel, Netlify, self-hosted. European Sleeper
heeft Azure als primary cloud, RAM API draait al op Azure App Service.

**Decision:**
**Azure Static Web Apps** (SWA) met auto-gegenereerde GitHub Actions workflow.
Push naar `main` = deploy.

**Consequences:**
- ✅ Native integratie met Entra External ID (zelfde tenant)
- ✅ Automatische HTTPS + global CDN
- ✅ `staticwebapp.config.json` lost SPA-routing op (`navigationFallback`)
- ✅ Free tier ruim voldoende voor Fase 0-ontwikkeling
- ❌ Feature-branches deployen niet automatisch (workflow triggert alleen op
  `main`); Preview-environments per PR is een betaalde feature
- ❌ `staticwebapp.config.json` moet altijd in sync zijn met routing-wijzigingen

---

## ADR-008 · Repo-layout: monolithic scaffold op repo-root

**Status:** Accepted

**Context:**
`FASE_0_SPEC.md` suggereert een subfolder `ram-frontend/` onder de assumptie
dat de Python DSP-code naast de frontend in dezelfde repo zou staan. Maar deze
repo (`wvhbuma/rmdsp`) bevat geen Python-code — DSP.py zit in een aparte repo.

**Decision:**
Scaffold op **repo-root**, niet in `ram-frontend/`. `app_location: "/"` in de
SWA-workflow reflecteert dit.

**Consequences:**
- ✅ Minder path-nesting; `src/`, `package.json`, `vite.config.ts` direct in
  root
- ✅ SWA-workflow werkt out-of-the-box met default `app_location: "/"`
- ❌ Afwijking van de spec-tekst — spec's `ram-frontend/`-structuur blijft
  gedocumenteerd in FASE_0_SPEC.md maar is hier niet geïmplementeerd
- ❌ Als er ooit Python (of een API) bij deze repo komt, moeten we de layout
  herzien (bv. `frontend/` + `api/`)

---

## Revisie

Deze ADRs reflecteren de staat aan het einde van Fase 0. Als Fase 1+ dwingt
tot heroverwegen (bv. state-library nodig, SSR vereist, etc.), voeg dan
nieuwe ADR toe (niet bestaande overschrijven) — zo blijft de historie
traceerbaar.

# Toevoegingen voor docs/ARCHITECTURE_DECISIONS.md

Voeg onderstaande decisions (9 en 10) toe aan je bestaande
`docs/ARCHITECTURE_DECISIONS.md`.

---

## 9. Build split from SWA deploy (Oryx bypass)

**Datum:** 22 april 2026
**Status:** Geïmplementeerd in `.github/workflows/azure-static-web-apps-salmon-desert-09cfbed03.yml`

### Context

Azure Static Web Apps gebruikt standaard Oryx als build-tool binnen de
`Azure/static-web-apps-deploy@v1` action. Oryx detecteert het project-type
(React, Next.js, etc) en runt een geschikte build-commando automatisch.

### Probleem

Oryx runt in een geïsoleerde Docker container die GEEN env-vars erft van de
GitHub Actions runner. Zelfs als we de env-vars op de deploy-action step zetten,
komen ze niet aan bij Vite tijdens `npm run build`.

Gevolg: Vite bakt lege strings in voor elke `import.meta.env.VITE_X` referentie,
de gedeployde app toont een ConfigError-pagina bij elke bezoeker.

Dit is een bekende bug in de SWA deploy-action met Vite en Next.js apps
(zie GitHub issues op Azure/static-web-apps repo).

### Alternatieven overwogen

1. **Azure SWA "Application Settings" gebruiken.** Werkt alleen voor SWA's
   ingebouwde Functions API, niet voor build-time env injection bij static apps.
   **Niet bruikbaar.**

2. **Build-time env-vars in vite.config.ts hardcoden.** Breekt security (secrets
   in git), breekt multi-environment (dev/acc/prd). **Niet acceptabel.**

3. **Runtime config via `/config.json` file.** Vite laadt dan config tijdens app-start
   in plaats van tijdens build. Werkt, maar:
   - Client-side HTTP-call op elke load (latency)
   - Complexer voor MSAL (init moet wachten op config)
   - Wijkt af van React/Vite community-standaard
   **Overweeg opnieuw als we dynamic config per tenant nodig hebben.**

4. **Oryx bypass met `skip_app_build: true`.** Wij bouwen zelf in een aparte
   GitHub Actions step, SWA-deploy krijgt alleen de `dist/` folder als upload.
   **Gekozen optie.**

### Beslissing

Split build in twee GitHub Actions steps:

```yaml
- name: Build App
  run: npm run build
  env:
    VITE_RAM_API_BASE_URL: ${{ secrets.VITE_RAM_API_BASE_URL }}
    # ... etc

- name: Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    app_location: "dist"
    skip_app_build: true
```

De `Build App` step runt op de GitHub Actions runner waar env-vars gewoon
werken. De `Deploy` step doet alleen nog upload, geen build.

### Consequenties

**Voordelen:**
- VITE_* env-vars werken zoals Vite-docs beschrijven (standaard patroon)
- Build-logs zijn transparant in GitHub Actions UI (Oryx-logs zijn beperkter)
- Snellere cold-deploy: geen Oryx-container setup meer
- Toekomstige build-customizations (type-check gates, test-runs vóór deploy)
  makkelijker toe te voegen

**Nadelen:**
- Workflow-YAML is langer (~25 regels extra)
- Afwijking van SWA "standaard" configuratie (nieuwe teamleden moeten dit
  begrijpen voor debugging)
- We verliezen Oryx's automatische platform-detection (maar we hebben die
  niet nodig — we weten dat het Vite is)

### Opmerkingen

Dit patroon is de-facto standaard geworden voor Vite + SWA combinaties in de
community. Bekend ook voor Next.js. Microsoft zelf erkent het probleem niet
als bug maar biedt ook geen oplossing.

Als we later overstappen naar Static Web Apps Preview (Functions-backed) of
een ander hosting-platform (Vercel, Netlify, Cloudflare Pages): deze split is
makkelijk terug te rollen omdat de app-code geen afhankelijkheid heeft.

---

## 10. Opinionated dashboards, selective widget customization

**Datum:** 22 april 2026
**Status:** Vastgesteld, implementatie fase 1 (hide/show) + fase 2+ (drag-and-drop)

### Context

RevenueMindz bouwt RAM als een opinionated RM-product: Wolter als domein-expert
definieert wat gebruikers zien op welke pagina, in welke volgorde. Dit is de
product-differentiator versus generieke BI-tools.

Echter, niet alle pagina's hebben dezelfde gebruiks-dynamiek. Sommige pagina's
worden gebruikt door meerdere rollen (CEO/CCO/RM) met fundamenteel verschillende
informatiebehoeften. Andere pagina's hebben een duidelijke single-purpose flow.

### Probleem

Twee UX-risico's:

1. **Te weinig flexibiliteit** — Gebruikers met afwijkende workflows voelen
   zich gestuurd door aannames die Wolter heeft gemaakt. Risico: frustratie,
   gebruikers wijken uit naar Excel-exports.

2. **Te veel flexibiliteit** — Leeg dashboard, gebruiker moet eerst widgets
   kiezen, onboarding wordt complex, demos worden onpersoonlijk, we verliezen
   de "expert-in-a-box"-positionering.

### Alternatieven overwogen

**Optie A: Volledig opinionated, nergens customization.**
- Simpelst te bouwen en te onderhouden
- Sterkste product-positionering ("wij weten wat RM's nodig hebben")
- Risico: gebruikers met afwijkende workflows haken af
- Niet gekozen

**Optie B: Volledig customizable, alle pagina's drag-and-drop.**
- Maximale flexibiliteit
- ~2-3x bouwtijd per pagina
- Onboarding wordt complexer (default view niet overtuigend)
- Differentieert minder van Tableau/PowerBI
- Niet gekozen

**Optie C: Pagina-specifieke flexibiliteit.**
- Pagina's classificeren als "dashboard" (opinionated) of "werkbank"
  (customizable)
- Dashboard-pagina's blijven strikt opinionated, alleen hide/show per sectie
- Werkbank-pagina's krijgen drag-and-drop, resize, widget-catalog
- Gekozen

### Beslissing

**Pagina-classificatie (initieel, te herzien na gebruiker-feedback):**

| Pagina | Type | Customization-niveau |
|---|---|---|
| Home | Dashboard | Hide/show only |
| Weekly Performance | Dashboard | Hide/show only |
| Monthly Performance | **Werkbank** | Full widgets (Fase 2+) |
| Cockpit | **Werkbank** | Full widgets (Fase 2+) |
| Decision Support | Dashboard | Hide/show only |
| Performance Analysis | Dashboard | Hide/show only |
| Fare Recommender | Dashboard | Hide/show only |
| Competitor Intel | Dashboard | Hide/show only |
| Customer Analytics | Dashboard | Hide/show only |
| Network View | Dashboard | Hide/show only |
| Operational Impact | Dashboard | Hide/show only |
| Margin Management | Dashboard | Hide/show only |
| Budget Targets | Dashboard | Hide/show only |
| Approval Rules | Settings | Geen (configuratie, geen weergave) |
| Audit Trail | Settings | Geen (logboek) |
| Decision Log | Settings | Geen (logboek) |
| Overbooking | Dashboard | Hide/show only |
| Ancillary | Dashboard | Hide/show only |
| Distribution Channels | Dashboard | Hide/show only |
| Flight Overview | Dashboard | Hide/show only |

**Rationale classificatie:**
- **Werkbank** = pagina wordt door meerdere rollen gebruikt in verschillende
  contexten, en er is geen "juiste" volgorde. Voorbeeld: Cockpit ochtend-check
  vs middag-deep-dive, Monthly voor CFO vs Monthly voor RM.
- **Dashboard** = pagina heeft een duidelijke opinionated flow die Wolter als
  expert heeft ontworpen. Wijzigen breekt de flow.

### Implementatie per fase

**Fase 1 (huidig):**
- Hide/show sectie-pattern implementeren op Weekly Performance (stap 7b)
- `HideableSection`, `useHiddenSections` hook, localStorage persist
- Pattern is herbruikbaar voor alle Dashboard-type pagina's

**Fase 2+ (Monthly Performance):**
- Bouw Monthly als Werkbank-pagina
- Library keuze: react-grid-layout (stabielste, meest features)
- Widget-catalog definiëren: ~8-12 widget-types voor Monthly
  (KPI-cards, ATP vs FC compare, Yield-trend, LF-chart, etc.)
- Layout persist in localStorage (Fase 2), user-preferences-tabel (Fase 3+)

**Fase 2+ (Cockpit):**
- Bouw Cockpit als tweede Werkbank-pagina
- Hergebruik widget-infrastructure uit Monthly
- Widget-catalog specifiek voor Cockpit (daily-KPIs, pace-indicators,
  alerts, competitor-moves)

**Niet in scope (voorlopig):**
- Custom widgets door eindgebruiker bouwen (SQL-editor, formula-builder)
- Widget-sharing tussen gebruikers
- Cross-device layout-sync (vereist backend user-preferences)

### Consequenties

**Voordelen:**
- Behoud van opinionated positionering op 90% van pagina's
- Flexibiliteit daar waar het echt waarde toevoegt (Cockpit, Monthly)
- Duidelijke richtlijn voor toekomstige pagina's ("is dit een Dashboard of
  Werkbank?")
- Hide/show pattern is strategisch laag-hangend fruit met groot UX-effect

**Nadelen:**
- Twee code-paden voor verschillende pagina-types
- Werkbank-pagina's kosten ~50-80% meer bouwtijd dan Dashboard-pagina's
- Widget-abstractie is complexer dan directe component-composition

**Risico's:**
- Scope-creep: druk om méér pagina's werkbank te maken. Tegenmaatregel:
  classificatie is onderdeel van deze ADR, wijzigen vereist nieuwe ADR.
- Over-engineering: widget-infrastructure wordt complex voor twee pagina's.
  Tegenmaatregel: eerst Monthly bouwen, leer daarvan, pas Cockpit-bouw aan.

### Herziening

Deze ADR wordt herzien:
- Na 3 maanden gebruik (Juli 2026) — is hide/show voldoende of vragen
  gebruikers om meer op Dashboard-pagina's?
- Na eerste Werkbank-pagina deployment (Monthly in Fase 2) — klopt de
  widget-abstractie? Is het onderhoudbaar?
- Bij nieuwe pagina-bouw — welke classificatie past?

### Opmerkingen

Deze beslissing is gebaseerd op huidige kennis van ES-gebruikers en Wolter's
RM-expertise. Na eerste echte gebruiker-feedback kan classificatie wijzigen.
Belangrijk: wijzigen is OK, maar bewust en gedocumenteerd, niet per toeval
tijdens een bouw-sessie.
