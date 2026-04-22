# Fase 0 — Lessons Learned

**Datum:** 22 april 2026
**Duur:** ~5 werkdagen (kickoff → live deployment)
**Resultaat:** React shell live op https://salmon-desert-09cfbed03.7.azurestaticapps.net
met werkende Entra External ID auth, 20 routes, design-tokens gematcht met DSP.

---

## Wat goed ging

**Scope-discipline.** Stap-voor-stap opdelen (7 genummerde stappen in FASE_0_SPEC.md)
werkte goed. Claude Code kon autonoom door een stap heen en stopte op het juiste moment
voor review. Geen scope-creep naar charts of echte data.

**Design tokens uit DSP overnemen.** De visuele continuïteit tussen DSP-notebook en
React-shell is direct zichtbaar. Tijd-investering in `DESIGN_TOKENS.md` vooraf
betaalde zich terug in elke component.

**Architectuur-beslissingen vóór de bouw.** De 8 decisions (Vite, TanStack Query later,
ECharts, MSAL, etc) kostten een ochtend maar voorkwamen herhaaldelijk heroverwegen
tijdens de bouw. Vastgelegd in ARCHITECTURE_DECISIONS.md.

**Split werkpatroon Wolter + Claude.ai + Claude Code.**
- Claude.ai voor architectuur, Azure Portal begeleiding, debugging van rare issues
- Claude Code voor daadwerkelijke bouw
- Wolter voor PR-merges (behoud van productie-gate)
Dit patroon vasthouden in Fase 1.

**Soft-fail config detection.** De `ConfigError`-pagina die Claude Code ingebouwd
heeft redde ons tijdens de deploy-saga. Zonder dat had de app gecrashed en was de
deploy-debug nog moeilijker geweest.

---

## Wat tegenviel

### De deployment-saga (3+ uur aan gedoe)
Één feature (werkende productie-deploy met env-vars) kostte disproportioneel veel
tijd door drie opeenvolgende issues:

1. Repository- vs Environment-secrets UI-val
2. Oryx vs Vite env-var injection
3. Per ongeluk deployment_token referenties verliezen in eerste workflow-patch

**Les:** deploy-configs zijn op geen enkel platform zo triviaal als de "Quickstart"-docs
doen voorkomen. Plan hier tijd voor in Fase 1's eerste pagina (opnieuw end-to-end
deployment-wijzigingen testen wanneer TanStack Query wordt toegevoegd).

### Microsoft naamgeving is slopend
"External Identities" vs "Microsoft Entra External ID" vs "Entra ID (B2C)" vs
"Workforce tenant" — vier verschillende producten, overlappende namen. Eén verkeerd
klikpad en je maakt de verkeerde tenant aan. Documentatie van Microsoft zelf is
deels tegenstrijdig door rebranding 2023-2024.

**Les:** altijd docs.microsoft.com checken als primaire bron, nooit Stack Overflow
antwoorden van vóór 2024.

### Ghost-processen op poort 5173
Vite schakelt stilzwijgend naar 5174 als 5173 bezet is. MSAL redirect URI klopt
dan niet meer. Dit kostte meerdere minuten debug tot ik het doorhad.

**Les:** bij elke dev-sessie checken dat 5173 vrij is, of een kill-command in je
standaard-workflow opnemen.

### Claude Code begrijpt het volledige mentale model niet
Claude Code is goed in focused code-taken, maar miste context die ik in Claude.ai
wel had (bv: waarom skip_app_build noodzakelijk is, waarom bepaalde auth-setups
nodig zijn voor multi-client-roadmap). Voor complex werk bleef klepel-werk nodig.

**Les:** belangrijke architectuur-beslissingen en context expliciet meegeven in
de kickoff-prompt van elke Claude Code-sessie, niet aannemen dat ze
"gelezen worden" uit CLAUDE.md alone.

---

## Verrassingen

**React-begrip kwam sneller dan verwacht.** Ik herkende patterns uit Python
(closures, immutability, type-guards) en kon de code lezen zonder tutorials.
MSAL was abstracter — dat is een wereld op zich.

**MSAL + Entra werkt gewoon als de config klopt.** De daadwerkelijke auth-flow
voelt magisch: redirect → Entra → terug → session. Maar de config eromheen (4 env-vars,
2 redirect URIs, 1 user flow, 1 app registration) moet precies kloppen. Eén tekort
en de hele flow valt stil met cryptische errors.

**Tailwind v4 is écht anders dan v3.** Geen `tailwind.config.ts` meer, alles via
`@theme` in CSS. Best wel elegant, maar je moet je ongedaan gewennen aan v3-tutorials.

**De Tailwind + gradient-circle op de login-pagina ziet er pro uit.** Minimale
moeite, groot effect. Design-details doen ertoe.

---

## Technische staat einde Fase 0

### Wat werkt
- React 18 + Vite 6 + TypeScript 5 (strict) scaffold op GitHub
- Tailwind v4 met ES-brand design tokens (kleuren, fonts, sidebar-width)
- React Router v7 met 20 routes + ComingSoon-placeholders
- MSAL + Entra External ID auth gate
- `/health` connectivity check mechanisme (wacht op backend endpoint)
- GitHub Actions deploy naar Azure SWA bij push naar main
- VITE_* env-vars correct geïnjecteerd via Repository Secrets

### Wat NIET werkt (en bewust)
- Backend `/health` endpoint bestaat nog niet → rode indicator op Home
- Geen data-fetching, geen charts, geen echte content (alles placeholders)
- Geen Google/Microsoft social login providers (alleen email/password via Entra)
- Geen feature flags, geen analytics, geen error-reporting
- Geen tests (geen Vitest, geen Playwright)
- Geen CI-type-check gate (Claude Code draait wel `tsc -b` lokaal)

### Ontbrekende documentatie
- Geen onboarding-guide voor lead dev of lead data scientist
- Geen deployment-runbook (wat te doen als deploy faalt?)
- Geen rollback-procedure

### Code-organisatie
```
src/
├── App.tsx                  # Router + AuthGate wrapper
├── main.tsx                 # MSAL init + bootstrap
├── auth/
│   ├── AuthGate.tsx         # Authenticated/Unauthenticated split
│   └── useAuth.ts           # Hook voor email/signIn/signOut
├── config/
│   ├── env.ts               # VITE_* env-var reader (type-safe, soft-fail)
│   └── msal.ts              # PublicClientApplication singleton
├── components/
│   ├── ComingSoon.tsx       # Placeholder voor alle route-pagina's
│   └── SystemStatus.tsx     # Health-check component
├── layout/
│   ├── Layout.tsx           # Shell (Sidebar + Topbar + content)
│   ├── Sidebar.tsx          # Navigation tree
│   ├── Topbar.tsx           # Page title + user email
│   ├── navigation.ts        # Data-driven nav-structuur
│   └── icons.tsx            # SVG icons
├── pages/
│   ├── Home.tsx             # Landing met health-check
│   ├── Login.tsx            # Pre-auth pagina
│   ├── ConfigError.tsx      # Fallback bij ontbrekende env-vars
│   ├── NotFound.tsx         # 404
│   └── _placeholders/       # 20x ComingSoon per route
└── styles/globals.css       # Tailwind v4 @theme
```

---

## Handoff naar Fase 1

### Onboarding lead dev
Hij moet:
1. Repo clonen, `npm install`, `npm run dev` werkend krijgen lokaal
2. Eerste taak: `/Dsp/WeeklyPerformance` endpoint bouwen in RAM API
   (specs in `RAM_API_Specification.md` sectie 4.1)
3. `/health` endpoint toevoegen in RAM API (leest DB-connectie + returns 200 OK)
4. CORS-configuratie op RAM API toestaan voor:
   - `http://localhost:5173`
   - `https://salmon-desert-09cfbed03.7.azurestaticapps.net`
5. Plan: hoe gaat de RAM API MSAL bearer tokens valideren? Dit is Fase 2-werk
   maar concept moet nu bedacht.

### Onboarding lead data scientist
Zij moet:
1. Repo clonen, lokale dev-environment werkend krijgen
2. Kleine oefen-PR maken (bv. tekst op Home.tsx aanpassen + deploy triggeren)
   om te wennen aan de flow
3. Klaar voor Fase 1 Weekly Performance pagina-bouw (parallel met lead dev's endpoint)

### Openstaande beslissingen voor Fase 1
- **API data-caching:** TanStack Query met welke stale-times? (Voorstel:
  5 min voor KPIs, 60 min voor reference data)
- **Chart library keuze:** Apache ECharts was Fase 0-decision, maar voor
  eenvoudige bar/line charts overwegen we of Recharts ook voldoet. Hangt af
  van interactiviteit-requirements.
- **Error-boundary patterns:** hoe tonen we API-errors vs auth-errors vs
  config-errors? Nu is het allemaal ad-hoc.
- **Loading states:** skeleton UI vs spinners? Per component of globaal?
- **Period-picker:** gedeelde component voor Weekly/Monthly/Curves, of
  per-pagina custom? (Voorstel: gedeeld, in `src/components/PeriodPicker.tsx`)

### Risico's voor Fase 1
1. **Backend-gap:** Weekly Performance endpoint bestaat nog niet. Frontend moet
   werken met mock data tot endpoint klaar is. Plan: mock-adapter in
   `src/mocks/weeklyPerformance.ts`, flag via env-var.
2. **Auth-token op backend-calls:** MSAL token moet als Bearer header mee. Onze
   huidige code doet dat nog niet. Extra werk in fetch-wrapper.
3. **CORS op RAM API:** als dit niet juist wordt ingericht, werkt geen enkele
   API-call vanaf de SWA. Eerste integratie-moment is spannend.
4. **Data volume:** DSP laadt booking-rijen. Bij honderdduizenden records
   moet de API aggregeren, niet raw data leveren. Lead dev moet dit
   meteen goed doen.
