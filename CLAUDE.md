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
ENTRA_TENANT_NAME=<<< TODO Wolter: bv. revenuemindzes.onmicrosoft.com >>>
ENTRA_TENANT_ID=<<< TODO Wolter: GUID >>>
ENTRA_CLIENT_ID=<<< TODO Wolter: GUID >>>
ENTRA_AUTHORITY_URL=<<< TODO Wolter: https://...ciamlogin.com/... >>>
ENTRA_USER_FLOW=<<< TODO Wolter: bv. B2C_1_signupsignin >>>

# RAM API
RAM_API_BASE_URL=https://ram-api-es-prd.azurewebsites.net
RAM_API_HEALTH_ENDPOINT=/health
```

## Gotchas uit eerdere sessies

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
