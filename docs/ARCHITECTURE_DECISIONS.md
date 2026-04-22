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
