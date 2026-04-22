# Session Log

Korte log per Claude Code-sessie / per stap uit `FASE_0_SPEC.md`. Per entry:
datum, wat gedaan, issues die we tegenkwamen, oplossingen.

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
