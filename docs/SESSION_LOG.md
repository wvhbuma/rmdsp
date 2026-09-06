# Session Log

Korte log per Claude Code-sessie / per stap uit `FASE_0_SPEC.md`. Per entry:
datum, wat gedaan, issues die we tegenkwamen, oplossingen.

---

## Sessie — 2026-09-06 — Start-RBD per route + één config-pad

**Doel:** de start-RBD van de seizoensmaskers instelbaar maken per route (stap 2),
na eerst het configuratiepad te consolideren (stap 1). Stap 3 (EMSR-b-allocatie
i.p.v. vaste profielpercentages) is besproken maar bewust NIET gebouwd.

Branch: `claude/start-rbd-per-route`. Raakt ook `~/Seasonal Planning/` (Python,
geen git-repo — backup van de gewijzigde bestanden staat in de scratchpad).

### Uitgangssituatie
Start-RBD was hardcoded op één plek: `server.py`, `{"High":"D","Med":"C","Low":"B"}`,
zonder route-dimensie. Daarnaast twee config-paden (Settings stuurde de config
inline mee, de wizard liet de server van schijf lezen) en zes config-bestanden
met vier verschillende inhouden.

### Stap 1 — één config-pad
- `server.py`: `CONFIG_PATH` van `seasonal-config-summer.json` → `seasonal-config.json`
  (die twee waren byte-identiek, dus gedragsneutraal).
- `seasonal-config.json` aangevuld met Nov + Dec elasticiteiten per bestemming
  (overgenomen uit `seasonal-config-winter.json`). Zonder die maanden vielen
  winterruns stilzwijgend terug op de hardcoded defaults in `build_es_season`,
  waardoor Nov/Dec uit code kwamen en Jan uit config.
- Frontend: `RunPipelineArgs.config` verwijderd; Settings stuurt de config niet
  meer inline mee. De run draait nu in de `onSuccess` van de save — parallel
  afvuren kon de pipeline de oude versie van schijf laten lezen.
- `NewSeason` toont vóór de run read-only welke config gaat gelden, met link naar
  Settings.
- Stale kopieën gearchiveerd naar `0. Archive/`: `seasonal_planner/server.py`
  (dode 746-regel kopie die zelf naar een ánder config-bestand wees) en de twee
  `seasonal_planner/seasonal-config*.json`.

### Stap 2 — start-RBD per route × cabine × profiel
- Config-vorm in `seasonal-config.json`, met `"*"` als wildcard op beide assen:
  `"startRbds": {"*": {"*": {"High":"D","Med":"C","Low":"B"}}}`.
  Resolutie: `[route][cabine]` → `[route]["*"]` → `["*"][cabine]` → `["*"]["*"]`
  → `DEFAULT_START_RBDS`.
- `config.py`: veld `RouteConfig.start_rbds` + `parse_start_rbds()` +
  `resolve_start_rbd()` + `DEFAULT_START_RBDS`. Ongeldige RBD's worden gelogd en
  genegeerd i.p.v. stil op "B" te vallen.
- `server.py`: `_apply_overrides` vult `start_rbds` per route (analoog aan
  `yield_multiplier`); de profile-assignment-loop gebruikt de resolver.
- `targets.py`: `apply_route_start_rbds()` — één chokepoint, aangeroepen in
  `pipeline.compute_targets()` ná `assign_profiles`. Dekt óók de auto-rule- en
  fallback-paden, die anders route-blind zouden blijven.
- Frontend: `StartRbdTable`-type, Start-RBD-sectie in Settings (per profiel, met
  "closed below"-kolom), read-only weergave van fijnmazigere overrides uit het
  config-bestand, en Profile/Start RBD-kolommen in SeasonTargets.

Gedragsneutraal bij de huidige config: de `*`/`*`-waarden zijn gelijk aan de oude
hardcoded map.

### Stap 1b — winter + zomer samengevoegd, alles per maand
- `seasonal-config-summer.json` en `-winter.json` samengevoegd tot één
  `seasonal-config.json` met alle twaalf maanden. Zomer wint bij overlap
  (januari — de enige maand die in beide stond). Bronbestanden + `kopie` naar
  `0. Archive/`; er is nu nog exact één config-bestand.
- **Constraints en zoneDiscounts zijn nu ook per maand**, net als de
  elasticiteiten. Daarmee passen winter en zomer in één bestand: Paris/Milan
  krijgen in nov/dec `maxYieldDecline 0.15`, `highLfThreshold 0.9`,
  `highLfYieldBonus 0.1` en afwijkende zone-factoren; jan–okt houdt de
  zomerwaarden.
- `config.py`: gedeelde parsers `expand_monthly()`, `build_monthly_overrides()`,
  `normalize_constraints()`, `month_key_to_int()`, `resolve_zone_discount()`.
  Zowel de per-maand-vorm als de oude platte vorm wordt gelezen — een plat blok
  geldt dan voor alle twaalf maanden, zodat een eerder geëxporteerd
  config-bestand blijft werken.
- `targets.py`: `_resolve_constraints()` resolvet nu óók `high_lf_threshold` en
  `high_lf_yield_bonus` per maand; die stonden vast op de dataclass-waarde
  terwijl ze de schakelaar zijn tussen mode A (volumegroei) en mode B
  (yieldgroei).
- `simulation.py`: zone-discount komt per departure-maand × cabine binnen in
  plaats van uit de module-globale `ZONE_DISCOUNT_FACTORS`. `_apply_overrides`
  muteert die global niet meer — dat lekte tussen runs door.
- `SeasonConfig.zone_discounts` toegevoegd; `simulate_season()` neemt hem als
  derde argument.
- Frontend: `normalizeSeasonalConfig()` vouwt platte blokken uit naar twaalf
  maanden, aangeroepen in `getConfig()` én bij handmatige upload. Settings heeft
  één maandkiezer bovenaan die elasticiteiten, constraints én zone-discounts
  stuurt, met per sectie een "apply to all months"-knop. NewSeason toont de
  waarden van de startmaand, met maandlabel in de kop.

### Stap 3 — EMSR-b allocatie
Keuzes van Wolter: μ uit de profielpercentages (geherschaald over de open
klassen), geschaald op **capaciteit**, σ = √μ (Poisson).

- `masks.py`: `_emsrb_booking_limits()` implementeert EMSR-b (Belobaba). Per
  klasse k wordt beschermd voor de klassen erboven:
  `y_k = μ_agg + z·σ_agg` met `z = Φ⁻¹(1 − f_k/f̄)`, booking limit = capaciteit − y_k.
  `Φ⁻¹` via `statistics.NormalDist` — geen nieuwe dependency.
  `_demand_per_class()` herschaalt de profielshares over de open klassen, zodat
  de te verdelen stoelen volledig tussen start-RBD en hoogste klasse landen.
- Booking limits worden teruggerekend naar incrementele protections, zodat de
  bestaande nesting-loop dezelfde AU_cum oplevert. Schema onveranderd: DB, de
  push naar RAM en de charts hoefden niet mee.
- Schakelbaar per bestemming: `"allocation": {"method": "emsrb"|"profile",
  "demandBasis": "capacity"|"target"}`. Code-default is `profile`, zodat een
  ouder config-bestand niet ineens van model wisselt; `seasonal-config.json`
  staat op `emsrb`. Settings heeft een Allocation-kaart om te wisselen.
- Zone-discounts spelen geen rol in EMSR-b: uniform per cabine, dus ze vallen weg
  in de verhouding `f_k/f̄`.

**Gevalideerd:** twee handberekeningen (2 en 3 klassen) exact gereproduceerd;
Σ protections == capaciteit; AU(J) == capaciteit; gesloten klassen AU 0; AU_cum
monotoon dalend; `protection == AU-verschil met de klasse eronder`; randgevallen
(geen vraag boven, vlakke ladder, één klasse, leeg, extreme vraag).

**Bevinding — lees dit vóór je hem op een echt seizoen zet.** Bij vraagbasis =
capaciteit (μ_totaal == capaciteit) verdeelt EMSR-b méér capaciteit naar de lage
klassen dan de profielladder: AU(C) 12 vs 18, C+D samen 40% van de capaciteit
tegen 30% bij het profiel. In de bottom-up fill-simulatie levert dat ~12% lagere
sim-revenue. EMSR-b wordt pas strakker dan het profiel als de vraag de capaciteit
overstijgt (μ/cap ≥ 1,2 → AU(C) = 2; μ/cap ≥ 1,5 → C dicht).

Twee oorzaken, allebei in de aannames en niet in de implementatie:
1. `au_distribution` in de profielen is ooit handmatig getuned als AU-ladder,
   niet als vraagvoorspelling. Als μ lezen we hem als "20% van de vraag zit in
   klasse E" — dat is nooit gekalibreerd.
2. `simulate_fill` verkoopt de target-units bottom-up zonder betalingsbereidheid;
   spill en recapture bestaan er niet. Strakker onderin scoort daar dus altijd
   beter. De simulatie is daarmee geen eerlijke scheidsrechter tussen twee
   allocatiemodellen.

### Stap 4 — start-RBD ook per maand
Keuze van Wolter: de start-RBD moet per bestemming × maand × cabine instelbaar
zijn. De overige settings houden hun huidige assen.

- `startRbds` krijgt een maand-as: route → maand → cabine → profiel, met `"*"` als
  wildcard op alle drie. Resolutie van specifiek naar algemeen, waarbij route
  zwaarder weegt dan maand en maand zwaarder dan cabine.
- `parse_start_rbds()` herkent via `_is_month_layer()` of een blok de maand-as
  heeft. De oude vorm (route → cabine → profiel) landt onder maand `"*"` en blijft
  dus voor alle maanden gelden — bestaande config-bestanden werken door.
- `resolve_start_rbd()` neemt nu een maand; `targets.apply_route_start_rbds()` en
  de profile-loop in `server.py` leiden die af uit `DepartureDate`.
- Frontend: `migrateStartRbds()` doet dezelfde migratie bij het inlezen.
  De Settings-kaart toont per gekozen maand een raster van profiel × cabine, met
  een "All cabins"-kolom en per cabine een cel die kan erven (grijze `— D —`) of
  overschrijven. Plus "apply to all months".

Gedragsneutraal: alle 12 maanden × 4 cabines × 3 profielen resolven naar D/C/B,
gelijk aan de oude vaste map.

**Gevalideerd:** wildcardketen en precedentie (6 gevallen), terugval (geen config,
lege tabel, ontbrekende maand, typefout), de oude vorm zonder maand-as, en een
echte round-trip — de UI-output door `esbuild`+node gegenereerd en daarna door de
Python-parser gelezen, met identieke resolutie aan beide kanten.

### Openstaand
- **EMSR-b evalueren op echte data** (Wolter). Vergelijk `profile` vs `emsrb` op
  één seizoen. Overweeg `demandBasis: "target"` — dan zet EMSR-b vraag tegenover
  capaciteit zoals bedoeld, in plaats van vraag == capaciteit aan te nemen.
- De echte volgende stap voor EMSR-b is μ uit PY-boekingen per RBD
  (`BookingPassengers.RBD`, mét unconstraining) in plaats van de profielmix.
  Zolang μ een handgetunede aanname is, optimaliseert EMSR-b tegen die aanname.
- Analyse-scripts (`analyze_elasticity_*.py`, `zone_discount_analyzer.py`,
  `analyze_summer_config.py`) printen nog "COPY-PASTE → seasonal-config-summer.json"
  met een plat constraints/zoneDiscounts-blok. Dat parseert nog (platte vorm
  wordt geaccepteerd) maar overschrijft dan álle twaalf maanden — inclusief de
  winterwaarden. Bewust niet half aangepast: die output moet naar de
  per-maand-vorm.
- `ES_ROUTES` is een module-level dict; `_apply_overrides` muteert die instanties
  (bestond al voor `yield_multiplier`). Waarden kunnen tussen runs blijven hangen
  voor bestemmingen die niet in het seizoen zitten.
- Stap 3: EMSR-b. Open keuzes: μ-bron (PY per RBD via `BookingPassengers.RBD`,
  mét unconstraining, vs. profielpercentages als prior), verdelen op capaciteit
  of op target-vraag, en de σ-aanname.

---

## Sessie — 2026-06-02 — Multi-Leg Displacement Analysis

**Doel:** nieuwe nav-groep "Multi-Leg Analysis" met 3 pagina's (Displacement
Reporting, Monthly Details, Departure Details), inclusief de Fase 1 data/chart-
foundation (TanStack Query + ECharts) die nog niet bestond.

Branch: `claude/displacement-analysis`

### Scope-afwijking (expliciet met Wolter afgestemd)
- De prompt ging uit van een bestaande WeeklyPerformance-blueprint
  (`api/performance.ts`, `useWeeklyPerformance`, ECharts) op branch
  `claude/demo-weekly-performance`. Die bestond NIET — repo stond op de Fase 0
  wrap-up commit zonder TanStack Query/ECharts. Met Wolter afgesproken:
  "displacement nu, foundation meebouwen" (wijkt af van Fase 1 scope-guard in
  CLAUDE.md die alleen Weekly Performance toestaat).
- Test-fixture `public/api/displacement.json` was niet aanwezig in de repo (Wolter
  dacht van wel). **Voorlopig een deterministisch gegenereerde placeholder-fixture
  geschreven** die exact de TypeScript-types volgt (48 summary / 768 departures /
  192 od / 768 legs, 2 markten, Apr 2025–Mar 2026). Vervang door echte data zodra
  beschikbaar — de fetch-laag pakt die transparant op.

### Gedaan
- Deps: `@tanstack/react-query` v5, `echarts` v6, `echarts-for-react`.
- `QueryClientProvider` in `main.tsx` (buiten de tree, StrictMode-safe).
- `src/types/displacement.ts`, `src/config/displacement.ts` (cabin-labels/kleuren/
  volgorde + station-afkortingen + theme-token-classes), `src/api/displacement.ts`
  (live API met fallback naar lokale fixture), `src/hooks/useDisplacement.ts`.
- `src/utils/format.ts` + `src/utils/displacement.ts` (filter/aggregatie-helpers).
- Gedeelde components: `EChart` (tree-shaken ECharts), `FilterBar` (macOS-menubar-
  stijl), `KpiCard`, `SectionCard`, `MonthTable` (jaar-subtotalen, ES-gradient
  header), `LfHeatmap` (custom HTML-tabel, sticky kolom, klikbare rijen),
  `StateViews`.
- 3 pagina's onder `src/pages/displacement/` + 3 routes + nav-groep + pageTitles
  + 4 nieuwe icons.
- Data-driven kleuren als Tailwind theme-tokens (cabin-*, lf-*, villain) i.p.v.
  inline styles, conform CLAUDE.md "geen inline styling". Enige resterende inline
  style is de ECharts-container-hoogte (library vereist het).

### Status: groen
`tsc -b`, `eslint`, `vite build` alle drie groen. Bundle ~1,13 MB (357 KB gzip);
ECharts is de bulk — code-splitting/lazy-loading van de 3 pagina's is een logische
vervolgstap (genoteerd, niet gedaan).

### Nog te doen / let op
- Echte `displacement.json` aanleveren (placeholder vervangen).
- Pagina's nog niet door Wolter handmatig getest in de browser.
- Cabin-control op Departures: tabs (heatmap/pax-flow) staan los van de FilterBar-
  cabin (die filtert de vertrektabel). Bewuste keuze — even checken of dat klopt.

---

## Sessie 1 — 2026-04-22

**Doel:** Fase 0 doorlopen (7 stappen).

Branch: `claude/react-ram-scaffolding-Ssual`

### Stap 1 — Repo setup + Azure deployment pipeline ✅

**Commit:** `11e7a4d feat(step-1): Vite + React 18 + TS scaffold met SWA fallback`

Gedaan:
- Vite scaffold manueel geschreven (niet `npm create vite@latest .` omdat de
  repo al `CLAUDE.md` + `docs/` bevatte — interactieve "overwrite?" prompt
  vermeden)
- Repo-root gebruikt i.p.v. subfolder `ram-frontend/` — SWA workflow had al
  `app_location: "/"` ingesteld
- `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` met de 4 strict
  flags (`strict`, `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`)
- `@/` path alias geconfigureerd op zowel Vite als TS kant
- `staticwebapp.config.json` met `navigationFallback` naar `/index.html`
- `.env.example` met placeholders voor alle Fase-0 env-vars
- ESLint 9 flat config
- Placeholder `favicon.svg` met gradient R-logo

Issues:
- **Push naar origin faalde meermaals met 403** van de lokale proxy tussen
  Claude Code en GitHub. Opgelost door de GitHub-autorisatie handmatig door
  Wolter te fixen. Commits waren veilig lokaal gedurende deze periode.

Keuzes:
- Vite 6 gekozen i.p.v. Vite 5 (spec zegt "latest", Vite 6 was stable op moment
  van schrijven)

### Stap 2 — Tailwind v4 + design tokens ✅

**Commit:** `fd37e2b feat(step-2): Tailwind v4 + ES-brand design tokens`

Gedaan:
- `tailwindcss@4` + `@tailwindcss/vite` plugin geïnstalleerd
- `src/styles/globals.css` met `@import "tailwindcss"` + `@theme` block
- Alle ES-tokens uit `DESIGN_TOKENS.md` in `@theme` gedeclareerd
  (`es-blue`, `es-magenta`, `rm-gray`, `rm-gray-light`, `rm-dark`, `rm-border`,
  `rm-bg`, `rm-surface`, `status-ok/warn/error`, `font-display`, `font-body`,
  `spacing-sidebar`)
- Google Fonts links in `index.html` (preconnect + Red Hat Display + Lato)
- `App.tsx` toont validation-blok uit DESIGN_TOKENS.md

Keuzes:
- **Geen `tailwind.config.ts`** — Tailwind v4 is CSS-first. De spec's deliverable
  "tailwind.config.ts met ES-tokens" is v3-syntax; v4 doet tokens via `@theme`
  in CSS. Spec's Gotcha erkent dit ("andere configuratie-syntax").

### Stap 3 — React Router v7 + Layout shell ✅

**Commit:** `9662c98 feat(step-3): React Router v7 + Layout shell met 20 routes`

Gedaan:
- `react-router-dom@7` geïnstalleerd
- `src/layout/Layout.tsx` (Sidebar + Topbar + Outlet in flex-grid)
- `src/layout/Sidebar.tsx` — data-driven via `navigation.ts`, één
  `useState<Set<string>>` voor alle open groups/subgroups, auto-open bij
  directe URL-landing via `findPathLocation()`
- `src/layout/Topbar.tsx` — paginatitel uit `pageTitles.ts` via `useLocation`
- `src/layout/navigation.ts` — authoritatieve nav-data (5 top-level items,
  20 leafs, 4 subgroups onder Business Overview)
- `src/layout/icons.tsx` — Feather-stijl inline SVG lookup-map, 25 icons
- `src/components/ComingSoon.tsx` — herbruikbare placeholder
- `src/pages/Home.tsx` — DSP-stijl welcome-circle
- `src/pages/NotFound.tsx` — 404 fallback
- 19 placeholder-pages in `src/pages/_placeholders/`
- `src/App.tsx` — `<BrowserRouter>` + 20 `<Route>`-definities

Issues:
- **DSP.py niet beschikbaar** in deze repo (volgens CLAUDE.md in aparte repo).
  Feather-stijl SVGs (MIT) zelf geschreven i.p.v. DSP-originelen overnemen.
  Lookup-map maakt later swap triviaal.

### Stap 4 — Topbar + Home-page polish ✅

**Commit:** `91886e7 feat(step-4): Topbar datum + Sidebar footer + Home polish`

Gedaan:
- Topbar: NL-locale datum rechts (`Intl.DateTimeFormat('nl-NL', ...)`) +
  user-email slot gereserveerd voor stap 5
- Sidebar: footer onderaan met versie + build-datum
- `__APP_VERSION__` + `__BUILD_DATE__` als Vite `define` compile-time constants
- Ambient type-declaratie in `vite-env.d.ts`
- `package.json` version → `0.1.0`
- `tsconfig.node.json`: `resolveJsonModule: true` voor `package.json` import in
  `vite.config.ts`
- Home: meer breathing room, subtle shadow op gradient-circle

### Stap 5 — MSAL + Entra External ID auth ⏸ GEPARKEERD

Gepauzeerd op verzoek van Wolter. Entra-env-vars (`VITE_ENTRA_*`) nog niet
beschikbaar. Hervat zodra Entra tenant + user flow + redirect-URI's (voor
`http://localhost:5173` én SWA-URL) geconfigureerd zijn.

### Stap 6 — `/health` connectivity check ✅

**Commit:** `0ef6529 feat(step-6): /health connectivity check op Home`

Gedaan:
- `src/config/env.ts` — type-safe soft-fail reader, exporteert
  `RAM_API_BASE_URL: string | null`
- `src/components/SystemStatus.tsx` — discriminated-union status
  (`not-configured` / `loading` / `ok` / `error`)
- `fetch` met `AbortController` cleanup in `useEffect` (StrictMode-safe)
- `src/vite-env.d.ts` — `ImportMetaEnv` extended met alle `VITE_*` keys
- `.env.example` — `VITE_RAM_API_BASE_URL` defaults naar ACC-URL
  (`https://ram-api-es-acc.azurewebsites.net`) voor Fase-0 development

Keuzes:
- **Soft-fail i.p.v. hard crash** bij ontbrekende env-var — prettiger voor dev
- **ACC-URL** i.p.v. PRD-URL uit de oorspronkelijke spec — op verzoek van Wolter

### Stap 7 — Documentatie + wrap-up ✅

**Commit:** (volgt)

Gedaan:
- `README.md` met setup/commands/deployment/contributing
- `docs/SESSION_LOG.md` (dit bestand)
- `docs/ARCHITECTURE_DECISIONS.md` met 8 ADRs voor de architectuur-keuzes

---

## Open punten voor volgende sessie

1. **Stap 5 afmaken** — MSAL + Entra auth zodra env-vars beschikbaar zijn
2. **Entra redirect-URI's** configureren in Azure Portal (zowel
   `http://localhost:5173` als SWA-URL)
3. **CORS op RAM API `/health`** — verifiëren dat zowel localhost als SWA-URL
   toegestaan zijn, anders rood indicator permanently
4. **DSP icon-overname** — als DSP.py ooit in deze repo beschikbaar komt, swap
   Feather-SVGs voor originelen in `src/layout/icons.tsx`
5. **PR naar `main`** — feature-branch `claude/react-ram-scaffolding-Ssual`
   mergen, dan triggert GitHub Actions de eerste deploy naar SWA
