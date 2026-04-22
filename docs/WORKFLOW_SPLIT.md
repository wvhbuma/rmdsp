# Werkverdeling Fase 1 — Claude.ai · Claude Code · Lead dev · Wolter

Dit document vervangt de impliciete afspraken die we in Fase 0 on-the-fly hebben
gemaakt. Expliciet vastgelegd voor Fase 1 en later.

---

## De vier actoren

| Actor | Waar | Wanneer inzetten |
|---|---|---|
| **Claude.ai** (deze chat) | Browser | Strategisch werk, Azure Portal begeleiding, debugging, docs |
| **Claude Code** | Desktop app in repo | Daadwerkelijke code-bouw, commits, tests |
| **Lead dev** (jouw partner) | Backend repo + VS Code | Backend endpoints, CORS, auth design |
| **Wolter** | Browser + terminal | PR-merges, secrets, testen, beslissingen |

---

## Verantwoordelijkheden per taak

### Code-bouw (frontend React)
**Claude Code** is primair. Hij:
- Volgt het 8-stappen plan in FASE_1_SPEC.md
- Commit per stap, pushed naar feature-branch
- Stopt voor review
- Houdt README + CLAUDE.md bij

**Claude.ai** kan helpen bij:
- Architectuur-keuzes die de 8-stappen plan raken
- Debugging van rare errors (TypeScript, build, runtime)
- Code-review: stuur diff + vraag "klopt dit met onze stack-keuzes?"

**Niet toegestaan voor Claude Code:**
- PRs aanmaken / mergen (Wolter's domein)
- Workflow-files wijzigen zonder expliciete vraag
- Nieuwe dependencies toevoegen zonder akkoord Wolter
- Architectuur-beslissingen maken die buiten FASE_1_SPEC.md vallen

### Code-bouw (backend RAM API)
**Lead dev** is primair. Hij:
- Bouwt `/Dsp/WeeklyPerformance` per API spec
- Bouwt `/health` endpoint
- Configureert CORS op RAM API
- Test zelf tegen lokale database

**Wolter** reviews via GitHub PRs op de backend repo.

**Claude.ai** kan helpen bij:
- Interpretatie van DSP Python logica → C# LINQ
- Diagnose van API-errors tijdens integratie
- Data-shape mismatches tussen mock en echte response

### Infrastructure (Azure, GitHub, Entra)
**Wolter** is primair, met hulp van **Claude.ai**.

| Taak | Wie doet | Waar |
|---|---|---|
| Nieuwe secrets toevoegen | Wolter | GitHub Settings |
| Azure RG / SWA aanpassingen | Wolter | Azure Portal |
| Entra redirect URIs toevoegen | Wolter | Entra Admin Center |
| CORS op RAM API | Lead dev | Azure App Service config |
| Workflow YAML wijzigen | Claude Code (alleen op verzoek) | repo |

### Testen
**Wolter** doet end-to-end testing.
- Lokaal na elke stap: `npm run dev` op localhost:5173
- Live na elke merge: incognito op salmon-desert URL
- Test zowel "happy path" als error states (bv. ongeldige filter)

**Claude Code** doet technische verificatie:
- `tsc -b` passes
- `npm run build` slaagt
- Geen eslint errors

**Niemand doet (nog) in Fase 1:**
- Unit tests
- E2E tests
- Performance tests
- Accessibility audit

### Documentatie
**Claude.ai** schrijft hoofddocumenten:
- FASE_X_SPEC.md
- FASE_X_LESSONS.md
- Belangrijke architectuur-decisions

**Claude Code** werkt bij tijdens bouw:
- README.md (per stap bijwerken als features toegevoegd worden)
- Kleine CLAUDE.md updates (nieuwe gotchas tijdens de stap)
- Code comments

**Wolter** reviewt en benadrukt:
- Waar staan we? Wat mist er? Wat moet naar hoofdniveau?

---

## Concrete scenario's

### Scenario A: Nieuwe stap van FASE_1_SPEC starten
1. Wolter → Claude Code: "Doe stap N uit FASE_1_SPEC.md"
2. Claude Code → bouwt, commit, push, stopt
3. Wolter lokaal: `git pull && npm install && npm run dev`, test
4. Wolter in GitHub: PR aanmaken, mergen
5. Wolter in incognito: test live URL
6. Als werkt: terug naar Claude Code voor volgende stap
7. Als niet werkt: Claude.ai voor debug-hulp

### Scenario B: Architectuur-vraag tijdens bouw
Claude Code stopt tijdens een stap met een vraag: "moet de KPI-comparison in
absolute waardes of percentage change?"

- **Niet:** Wolter beslist ad-hoc en Claude Code gaat door
- **Wel:** Wolter komt naar Claude.ai, we bespreken, beslissing vastleggen in
  FASE_1_SPEC.md (of decisions-doc), daarna terug naar Claude Code met
  duidelijke richting

### Scenario C: Backend endpoint klaar, integratie
1. Lead dev meldt: endpoint is deployed naar ACC
2. Wolter → Claude.ai: "Kunnen we integreren? Hier is de gedocumenteerde response."
3. Claude.ai: vergelijkt met mock shape, signaleert afwijkingen
4. Als verschillen minimaal: Claude Code mag stap 8 (integratie) doen
5. Als groot: eerst mock data aanpassen naar realiteit, of backend aanpassen

### Scenario D: Onverwachte deploy-fout
- **Niet:** Wolter en Claude Code samen eindeloos sleutelen
- **Wel:** Screenshot naar Claude.ai, Claude.ai diagnose, expliciete instructies
  naar Claude Code OF naar Wolter (direct)

### Scenario E: Lead dev heeft backend-vraag
Lead dev heeft een vraag over DSP-logica, bv. "hoe bereken ik CW_START in
C#?" of "wat telt als een 'slow mover'?"

- Wolter kan deze beantwoorden vanuit het DSP Python-model
- Of Wolter brengt het in Claude.ai → Claude.ai extraheert uit de DSP Python
  de exacte berekening en levert pseudo-code of C# snippet
- Lead dev bouwt zelf de C# LINQ versie

### Scenario F: Wolter heeft een simpele vraag
"Hoe werkt useSearchParams ook alweer?"

Twee opties, beide prima:
- Direct in Claude.ai vragen (snelle uitleg, niet-blocking)
- Google / React docs (als je die mental-model zelf wilt bouwen)

Claude Code is geen zoekmachine — niet voor losse tutorials gebruiken.

---

## Anti-patterns (wat we NIET doen)

**Anti-pattern 1:** Wolter modificeert code lokaal buiten Claude Code om.
- Waarom niet: commits raken verwisseld, Claude Code raakt de draad kwijt
- In plaats daarvan: vraag Claude Code de aanpassing te doen

**Anti-pattern 2:** Claude Code beslist over architectuur tijdens een stap.
- Waarom niet: Claude Code heeft beperkte context over de totale product-richting
- In plaats daarvan: Claude Code stopt, Wolter consulteert Claude.ai, dan verder

**Anti-pattern 3:** Claude.ai schrijft code die Wolter copy-pastet naar repo.
- Waarom niet: omzeilt Claude Code's commit-historie, breekt git-flow
- In plaats daarvan: Claude.ai legt uit, Claude Code bouwt

**Anti-pattern 4:** Lead dev werkt in de frontend repo.
- Waarom niet: tenzij expliciet afgesproken creëert dit parallel work dat kan
  conflicteren met Claude Code's commits
- Uitzondering: oefen-PR (bv. README-tekst aanpassen) om vertrouwd te worden

**Anti-pattern 5:** Fase 1 scope uitbreiden zonder heroverwegen.
- "Kunnen we Monthly Performance ook even meenemen?" → Nee.
- In plaats daarvan: Fase 2 plannen, expliciete beslissing.

---

## Rol-specifieke checklists

### Voor Wolter aan het begin van elke Claude Code-sessie
- [ ] `git pull` lokaal op main, zorg dat je up-to-date bent
- [ ] Check of er openstaande PRs zijn — eerst mergen als ze klaar zijn
- [ ] Werkdocumenten openen: FASE_1_SPEC.md, huidige status
- [ ] Duidelijke vraag formuleren: "Doe stap X" of "Los issue Y op"

### Voor Wolter na elke Claude Code-stap
- [ ] Lokaal pullen en testen
- [ ] Build-logs checken (geen TS errors)
- [ ] Visuele check in browser
- [ ] Korte check: is de commit-message helder?
- [ ] Dan pas: PR + merge

### Voor Claude.ai aan het begin van elk onderwerp
- [ ] Wolter deelt context: welke stap zijn we in, wat is er al gebouwd
- [ ] Vraag helder stellen: debug? beslissing? uitleg?
- [ ] Als Claude.ai onzeker: eerst vragen naar huidige staat (screenshot, code snippet)
