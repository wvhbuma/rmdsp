# RAM — Revenue Automation & Management

React-frontend voor het RAM-dashboard van **European Sleeper**, gebouwd door
RevenueMindz. Fase 0-scaffolding: shell, navigatie, auth-gate, design tokens —
nog geen business-features (die volgen in Fase 1+).

Live: https://salmon-desert-09cfbed03.7.azurestaticapps.net

---

## Prerequisites

- **Node.js 20+** (ontwikkeld op Node 22)
- **npm 10+**

Check je versies:

```bash
node --version
npm --version
```

---

## Setup

```bash
# 1. Clone
git clone https://github.com/wvhbuma/rmdsp.git
cd rmdsp

# 2. Dependencies
npm install

# 3. Env-vars (niet committen — .env.local staat in .gitignore)
cp .env.example .env.local
# open .env.local en vul de waarden in (zie onder)

# 4. Dev-server
npm run dev
# → http://localhost:5173
```

### Env-vars

Alle frontend-env-vars moeten prefix `VITE_` hebben, anders exposure Vite ze niet
aan de browser. Zie `.env.example` voor de volledige lijst. Minimum om `npm run
dev` te draaien: alles mag leeg; de app gebruikt soft-fail defaults en toont
"not configured" where relevant.

Voor een volledig werkende dev-omgeving:

| Var | Waarde (ACC) | Nodig voor |
|---|---|---|
| `VITE_RAM_API_BASE_URL` | `https://ram-api-es-acc.azurewebsites.net` | System status health check |
| `VITE_ENTRA_TENANT_NAME` | *TODO* | MSAL login (stap 5) |
| `VITE_ENTRA_CLIENT_ID` | *TODO* | MSAL login (stap 5) |
| `VITE_ENTRA_AUTHORITY_URL` | *TODO* | MSAL login (stap 5) |
| `VITE_ENTRA_USER_FLOW` | *TODO* | MSAL login (stap 5) |

Productie-waarden staan in Azure Portal → Static Web App → **Configuration**.

---

## Commands

| Command | Beschrijving |
|---|---|
| `npm run dev` | Dev-server op http://localhost:5173 met hot reload |
| `npm run build` | Productie-bundel in `dist/` (tsc check + vite build) |
| `npm run preview` | Preview van de `dist/`-bundel lokaal |
| `npm run type-check` | TypeScript-check zonder emit |
| `npm run lint` | ESLint over alle `.ts`/`.tsx` files |

---

## Deployment

**Push naar `main` = deploy naar Azure Static Web Apps.**

De GitHub Actions workflow in `.github/workflows/azure-static-web-apps-*.yml`
triggert op elke push en elke pull-request naar `main`. Workflow:
1. Checkout
2. `npm install`
3. `npm run build`
4. Upload `dist/` naar SWA via `Azure/static-web-apps-deploy@v1`

Feature-branches (zoals `claude/react-ram-scaffolding-Ssual`) deployen **niet**
automatisch — die moeten eerst via PR naar `main`.

Azure Static Web Apps configuratie:
- `app_location: "/"` (repo-root)
- `output_location: "dist"` (Vite default)
- `staticwebapp.config.json` in repo-root verzorgt SPA-routing fallback
  (`/weekly` direct intikken werkt, geen 404)

---

## Projectstructuur

```
rmdsp/
├── CLAUDE.md                   # Persistent context voor Claude Code
├── README.md                   # Dit bestand
├── docs/
│   ├── FASE_0_SPEC.md          # Bouwspec voor Fase 0
│   ├── NAV_STRUCTURE.md        # 20 routes en hiërarchie
│   ├── DESIGN_TOKENS.md        # ES-brand tokens
│   ├── SESSION_LOG.md          # Log per Claude Code-sessie
│   └── ARCHITECTURE_DECISIONS.md  # 8 ADR's
├── src/
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # BrowserRouter + 20 routes
│   ├── config/
│   │   └── env.ts              # Type-safe env-var reader
│   ├── layout/
│   │   ├── Layout.tsx          # Sidebar + Topbar + Outlet
│   │   ├── Sidebar.tsx         # Expand/collapse nav
│   │   ├── Topbar.tsx          # Paginatitel + datum + user-slot
│   │   ├── navigation.ts       # Nav-data (bron voor Sidebar + titles)
│   │   ├── pageTitles.ts       # Path → title map
│   │   └── icons.tsx           # Inline SVG icon lookup
│   ├── components/
│   │   ├── ComingSoon.tsx      # Placeholder voor niet-gebouwde pages
│   │   └── SystemStatus.tsx    # Health-check kaart
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── NotFound.tsx
│   │   └── _placeholders/      # 19 placeholder-pages
│   └── styles/
│       └── globals.css         # Tailwind + @theme ES-tokens
├── staticwebapp.config.json
├── vite.config.ts
├── tailwind.config.ts          # (leeg — tokens staan in globals.css @theme)
├── tsconfig*.json
└── package.json
```

---

## Contributing

Code-conventies:

- **Geen `any`-types** zonder inline comment met reden
- **Imports via `@/` alias** (bv. `import { Icon } from '@/layout/icons'`),
  geen `../../` paden
- **Bestandsnamen**: components PascalCase, hooks `useX.ts`, utils camelCase
- **Geen default exports** voor components (behalve lazy-load gevallen)
- **Eén component per bestand** (kleine private sub-components mogen bij de parent)
- **Geen inline styling** — Tailwind utilities of CSS-variabelen
- **Werktaal Nederlands** in commit-messages en comments; identifiers + strings
  in code blijven Engels voor consistentie met de rest van de ecosystem

Checklist voor elke commit:

```bash
npm run type-check   # moet groen zijn
npm run lint         # moet groen zijn
npm run build        # moet groen zijn
```

Commit-message-conventie: `feat(step-N): korte beschrijving` voor Fase-0
scaffolding-stappen. Voor Fase 1+ gebruiken we standaard Conventional Commits
(`feat:`, `fix:`, `refactor:`, `docs:`, etc.).

Feature-branches: `claude/<korte-beschrijving>` voor Claude Code-werk,
`feat/<naam>` voor menselijke devs. Pull-request naar `main`, minimaal één
goedkeuring, CI moet groen zijn.

---

## Fase 0 → Fase 1

Deze repo is **scaffolding-only**. Wat er bewust NIET in zit:

- ❌ Charts (Apache ECharts komt in Fase 1)
- ❌ Data-fetching-library (TanStack Query komt in Fase 1)
- ❌ Echte pagina-inhoud (Fase 1+)
- ❌ Mobile responsive (Fase 6+)

Suggesties voor Fase 1+ gaan in `docs/FASE_1_BACKLOG.md` (nog aan te maken).

---

## Licentie

Proprietary — RevenueMindz / European Sleeper.
