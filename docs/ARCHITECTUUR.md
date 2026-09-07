# RAM Frontend — architectuur

React-frontend voor RAM (Revenue Automation & Management) van European Sleeper.
Draait als Azure Static Web App op
[reporting.europeansleeper.ram-app.com](https://reporting.europeansleeper.ram-app.com).

Dit document beschrijft wat er waar zit en hoe de data loopt. Voor de
*beslissingen* achter de architectuur: `ARCHITECTURE_DECISIONS.md`. Voor de
seizoensbackend: `ARCHITECTUUR.md` in
[`wvhbuma/seasonalplanning`](https://github.com/wvhbuma/seasonalplanning).

---

## 1. Twee backends, en dat is belangrijk

De app praat met **twee verschillende API's**. Wie dat door elkaar haalt, zoekt
lang.

| Env-var | Wijst naar | Gebruikt door |
|---|---|---|
| `VITE_RAM_API_BASE_URL` | `ram-api-es-prd.azurewebsites.net` | Displacement, Budget & Targets |
| `VITE_SEASONAL_API_BASE_URL` | `ram-seasonal-es-prd.azurewebsites.net` | alle Season Planning-pagina's |

Beide worden **build-time** ingebakken door Vite. Een wijziging in een GitHub
Secret werkt pas na een nieuwe build; Application Settings in de Azure Portal
doen niets.

Zonder `VITE_SEASONAL_API_BASE_URL` valt `src/api/seasonal.ts` terug op
`http://localhost:5050` — de dev-fallback. Dat is handig lokaal, maar op een
gedeployde site stuurt het bezoekers naar hun eigen machine.

De displacement-laag heeft een eigen vangnet: is de live API onbereikbaar, dan
leest hij `public/api/displacement.json` en logt dat. Zo blijft de UI
demonstreerbaar zonder backend.

---

## 2. Modules

| Groep | Pagina's | Status |
|---|---|---|
| **Season Planning** | New Season, Overview, Targets, Masks, Simulation, Implementation, Settings | in gebruik |
| **Multi-Leg Analysis** | Displacement Reporting, Monthly Details, Departure Details | in gebruik |
| **Budget & Targets** | BudgetTargets | in gebruik |
| **Settings** | API Configuration, User Preferences | in gebruik |
| **Overig** | ~20 routes onder `pages/_placeholders/` | ComingSoon-placeholders |

De placeholders houden de navigatiestructuur compleet zonder dat er functionaliteit
achter zit. Zie `NAV_STRUCTURE.md`.

---

## 3. Technische opzet

Vite + React 18 + TypeScript (strict), React Router v7 in library mode, Tailwind
v4, TanStack Query v5 voor server-state, ECharts voor grafieken, MSAL met
Microsoft Entra voor authenticatie.

```
src/
  api/          fetch-wrappers per backend (displacement.ts, seasonal.ts)
  hooks/        TanStack Query-hooks + localStorage-hooks
  components/   displacement/ (gedeeld), seasonal/, settings/
  pages/        per module een map
  config/       env, routes, cabines, kleuren, seasonal-helpers
  layout/       navigatie, iconen, paginatitels
  types/        displacement.ts, seasonal.ts
```

Conventie: geen default exports voor components, absolute imports via `@/`, geen
inline styling. Zie `CLAUDE.md`.

### Datalaag

Elke pagina praat via een hook, nooit rechtstreeks met `fetch`. De hooks in
`hooks/useSeasonal.ts`:

`useDiscoverRoutes` · `useSeasonalProducts` · `useSeasonalResults` ·
`useSessionResults` · `useSeasonalSessions` · `useRunPipeline` · `useImplement` ·
`usePushTargets` · `useSaveConfig` · `useSeasonalConfig`

`fetch` gooit niet bij 4xx/5xx, dus de wrappers checken zelf `res.ok`.

---

## 4. Season Planning in detail

### De flow

```
New Season          periode → routes → profielen per vertrek → Run Pipeline
  ↓
Overview            samenvatting van de laatste run
Targets             targets per vertrek × cabine, met Profile en Start RBD
Masks               AU-verdeling per klasse
Simulation          verwachte revenue en yield
Implementation      dry run en push naar RAM
Settings            configuratie per bestemming
```

### Sessies en de actieve sessie

Elke pipelinerun maakt een **sessie** in de database. De pagina's tonen standaard
`/results/latest`. Laad je een ouder seizoen, dan zet `useActiveSession` een
sessie-id in localStorage en tonen alle pagina's die sessie tot je op **Reset to
latest** klikt.

Een sessie is een momentopname: de opgeslagen waarden veranderen niet als je
daarna Settings aanpast. `SessionBadge` vergelijkt de config waarmee de sessie
draaide met de huidige en meldt het verschil — welke bestemming, welke velden.

Zowel de wizard als "Re-run with these settings" wissen de actieve sessie na een
run, zodat je het verse resultaat ziet.

### Settings

Bovenaan kies je bestemming en maand; die maandkeuze stuurt drie van de vijf
blokken.

| Blok | Assen |
|---|---|
| Yield multiplier | per bestemming |
| Allocation | per bestemming (`profile` of `emsrb`, plus vraagbasis) |
| Start RBD | maand × cabine × profiel, met een "All cabins"-kolom waarvan cellen kunnen erven |
| Elasticities | maand × cabine |
| Constraints | maand |
| Zone / sharing discounts | maand × cabine |

De Start RBD-kaart toont per profiel een rij met een All cabins-waarde en vier
cabinekolommen. Een cabinecel die op `— D —` staat erft en komt niet in de config;
kies je een letter, dan wordt het een override.

Route-specifieke regels kun je alleen in het config-bestand zetten; die worden
read-only getoond zodat ze niet onzichtbaar meedraaien.

### Eén config-pad

De server leest de configuratie **altijd van schijf**. Settings is de enige
schrijver:

```
Settings → POST /api/seasonal/config → seasonal-config.json
                                            ↓
New Season / Re-run → POST /api/seasonal/run  (leest dat bestand)
```

"Re-run with these settings" slaat eerst op en draait de pipeline pas in de
`onSuccess` — parallel afvuren zou de oude versie kunnen lezen. De wizard stuurt
geen config mee en toont read-only welke instellingen gaan gelden.

`normalizeSeasonalConfig()` in `config/seasonal.ts` vouwt oudere config-vormen uit
naar de huidige (maandblokken, maand-as op start-RBD's), zodat een handmatig
geüpload bestand blijft werken.

---

## 5. Client-side state

| Wat | Waar | Sleutel |
|---|---|---|
| Actieve sessie | localStorage | `useActiveSession` |
| RAM API-key | localStorage | `useApiConfig` — alleen bij een live push meegestuurd |
| Gebruikersvoorkeuren | localStorage | `useUserPreferences` |
| Server-state | TanStack Query-cache | per `queryKey` |

Filters op de pagina's zijn lokale `useState`. De URL-param/localStorage-strategie
uit `FASE_1_SPEC.md` is nog niet overal doorgevoerd.

---

## 6. Deployment

| Workflow | Trigger | Doel |
|---|---|---|
| `deploy-production.yml` | push naar `main` | `es-business-performance` → reporting |
| `deploy-preview.yml` | pull request naar `main` | `swa-rmdsp-tst` → salmon-desert, één omgeving per PR |

Twee dingen die eerder zijn misgegaan en nu vastliggen:

**Oryx wordt overgeslagen.** We bouwen expliciet met `npm run build` en env-vars
op step-niveau, want Oryx draait in een aparte container en ziet de env-vars van
de deploy-action niet. Vereenvoudig die split-build niet.

**Geen OIDC bij de SWA-deploy.** Met `github_id_token` bepaalt Azure de doel-app
via de repo-koppeling en negeert het deployment-token. Alle deploys landden
daardoor op de testomgeving, ongeacht welk token in de secret stond.

Secrets moeten **Repository** secrets zijn, niet Environment secrets. De UI is
daarin misleidend.

---

## 7. Valkuilen

**De twee repo's horen bij elkaar.** Verandert de vorm van `seasonal-config.json`,
dan moeten frontend en backend allebei mee. Een oudere backend valt bij een nieuwe
config-vorm stil terug op zijn defaults.

**Env-vars zijn build-time.** `import.meta.env.VITE_X`, nooit `process.env`. Een
gewijzigd secret vereist een nieuwe build.

**Er is geen prettier-config.** De codebase is met de hand opgemaakt: single
quotes, geen puntkomma's. `npx prettier --write` herschrijft alles en levert
honderden regels ruis op.

**Entra-redirect-URI's moeten exact matchen**, inclusief poort en protocol.
Bezet Vite 5174 in plaats van 5173, dan klopt de redirect niet meer.

**MSAL en StrictMode** kunnen dubbele initialisatie geven. Volg de officiële
Microsoft-samples.
