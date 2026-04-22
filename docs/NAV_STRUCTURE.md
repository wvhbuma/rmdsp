# Nav Structure — 20 Routes

Volledige navigatiestructuur zoals gereproduceerd uit `RAM_DSP.py` regels 2103-2248. **Deze hiërarchie is authoritatief voor de React Sidebar.**

## Overzicht

5 top-level items: **Home** + 4 parent-groepen. Totaal 20 leaf-routes.

```
Home                                          → /
Flight Optimization ▾
├── Overview                                  → /flight-overview
├── Cockpit                                   → /cockpit
├── Network View                              → /network-view
└── Fare Recommender                          → /fare-recommender
Business Overview ▾
├── Performance ▸
│   ├── Weekly Performance                    → /weekly
│   ├── Monthly Performance                   → /monthly
│   ├── Decision Support                      → /decision-support
│   └── Performance Analysis                  → /performance-analysis
├── Customer ▸
│   └── Customer Analytics                    → /customer-analytics
├── Operations ▸
│   ├── Operational Impact                    → /operational-impact
│   └── Margin Management                     → /margin-management
└── Market ▸
    └── Competitor Intel                      → /competitor-intel
Business Management ▾
├── Distribution & Channels                   → /distribution-channels
├── Overbooking                               → /overbooking
├── Ancillary Management                      → /ancillary
└── Budget & Targets                          → /budget-targets
Settings ▾
├── Audit Trail                               → /audit
├── Decision Log                              → /decision-log
└── Approval Rules                            → /approval-rules
```

## Volledige route-tabel

| # | Display Label | URL Path | DSP key | Parent | Subgroup | ComingSoon feature |
|---|---|---|---|---|---|---|
| 1 | Home | `/` | `home` | — | — | (Home page, niet coming soon) |
| 2 | Overview | `/flight-overview` | `fo` | Flight Optimization | — | Flight Overview |
| 3 | Cockpit | `/cockpit` | `ck` | Flight Optimization | — | Cockpit |
| 4 | Network View | `/network-view` | `nv` | Flight Optimization | — | Network View |
| 5 | Fare Recommender | `/fare-recommender` | `fr` | Flight Optimization | — | Fare Recommender |
| 6 | Weekly Performance | `/weekly` | `wp` | Business Overview | Performance | Weekly Performance |
| 7 | Monthly Performance | `/monthly` | `mpo` | Business Overview | Performance | Monthly Performance |
| 8 | Decision Support | `/decision-support` | `ds` | Business Overview | Performance | Decision Support |
| 9 | Performance Analysis | `/performance-analysis` | `pa` | Business Overview | Performance | Performance Analysis |
| 10 | Customer Analytics | `/customer-analytics` | `ca` | Business Overview | Customer | Customer Analytics |
| 11 | Operational Impact | `/operational-impact` | `oi` | Business Overview | Operations | Operational Impact |
| 12 | Margin Management | `/margin-management` | `mg` | Business Overview | Operations | Margin Management |
| 13 | Competitor Intel | `/competitor-intel` | `ci` | Business Overview | Market | Competitor Intel |
| 14 | Distribution & Channels | `/distribution-channels` | `dch` | Business Management | — | Distribution & Channels |
| 15 | Overbooking | `/overbooking` | `ob` | Business Management | — | Overbooking |
| 16 | Ancillary Management | `/ancillary` | `am` | Business Management | — | Ancillary Management |
| 17 | Budget & Targets | `/budget-targets` | `bt` | Business Management | — | Budget & Targets |
| 18 | Audit Trail | `/audit` | `audit` | Settings | — | Audit Trail |
| 19 | Decision Log | `/decision-log` | `dlog` | Settings | — | Decision Log |
| 20 | Approval Rules | `/approval-rules` | `appr` | Settings | — | Approval Rules |

---

## React Router definitie

Voorgestelde structuur voor `src/App.tsx`:

```tsx
<BrowserRouter>
  <Routes>
    <Route element={<AuthGate><Layout /></AuthGate>}>
      <Route index element={<Home />} />
      
      {/* Flight Optimization */}
      <Route path="flight-overview" element={<FlightOverview />} />
      <Route path="cockpit" element={<Cockpit />} />
      <Route path="network-view" element={<NetworkView />} />
      <Route path="fare-recommender" element={<FareRecommender />} />
      
      {/* Business Overview */}
      <Route path="weekly" element={<WeeklyPerformance />} />
      <Route path="monthly" element={<MonthlyPerformance />} />
      <Route path="decision-support" element={<DecisionSupport />} />
      <Route path="performance-analysis" element={<PerformanceAnalysis />} />
      <Route path="customer-analytics" element={<CustomerAnalytics />} />
      <Route path="operational-impact" element={<OperationalImpact />} />
      <Route path="margin-management" element={<MarginManagement />} />
      <Route path="competitor-intel" element={<CompetitorIntel />} />
      
      {/* Business Management */}
      <Route path="distribution-channels" element={<DistributionChannels />} />
      <Route path="overbooking" element={<Overbooking />} />
      <Route path="ancillary" element={<Ancillary />} />
      <Route path="budget-targets" element={<BudgetTargets />} />
      
      {/* Settings */}
      <Route path="audit" element={<AuditTrail />} />
      <Route path="decision-log" element={<DecisionLog />} />
      <Route path="approval-rules" element={<ApprovalRules />} />
      
      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
</BrowserRouter>
```

---

## Sidebar-structuur als data (voor dynamische rendering)

Claude Code kan overwegen om de nav als data te declareren in plaats van hardcoded JSX:

```ts
// src/layout/navigation.ts
export interface NavItem {
  label: string;
  path: string;
  icon?: string;          // SVG path of component name
  children?: NavItem[];
  subgroups?: NavGroup[]; // voor Business Overview
}

export interface NavGroup {
  label: string;
  icon?: string;
  items: NavItem[];
}

export const NAVIGATION: NavItem[] = [
  { label: 'Home', path: '/', icon: 'home' },
  {
    label: 'Flight Optimization',
    path: '',
    icon: 'activity',
    children: [
      { label: 'Overview', path: '/flight-overview', icon: 'target' },
      { label: 'Cockpit', path: '/cockpit', icon: 'clock' },
      { label: 'Network View', path: '/network-view', icon: 'network' },
      { label: 'Fare Recommender', path: '/fare-recommender', icon: 'layers' },
    ],
  },
  {
    label: 'Business Overview',
    path: '',
    icon: 'bar-chart',
    subgroups: [
      {
        label: 'Performance',
        icon: 'trending-up',
        items: [
          { label: 'Weekly Performance', path: '/weekly', icon: 'calendar' },
          { label: 'Monthly Performance', path: '/monthly', icon: 'grid' },
          { label: 'Decision Support', path: '/decision-support', icon: 'activity' },
          { label: 'Performance Analysis', path: '/performance-analysis', icon: 'search' },
        ],
      },
      {
        label: 'Customer',
        icon: 'users',
        items: [
          { label: 'Customer Analytics', path: '/customer-analytics', icon: 'user-search' },
        ],
      },
      {
        label: 'Operations',
        icon: 'sun',
        items: [
          { label: 'Operational Impact', path: '/operational-impact', icon: 'alert-triangle' },
          { label: 'Margin Management', path: '/margin-management', icon: 'dollar' },
        ],
      },
      {
        label: 'Market',
        icon: 'eye',
        items: [
          { label: 'Competitor Intel', path: '/competitor-intel', icon: 'eye' },
        ],
      },
    ],
  },
  {
    label: 'Business Management',
    path: '',
    icon: 'layout',
    children: [
      { label: 'Distribution & Channels', path: '/distribution-channels', icon: 'share' },
      { label: 'Overbooking', path: '/overbooking', icon: 'users' },
      { label: 'Ancillary Management', path: '/ancillary', icon: 'package' },
      { label: 'Budget & Targets', path: '/budget-targets', icon: 'target' },
    ],
  },
  {
    label: 'Settings',
    path: '',
    icon: 'settings',
    children: [
      { label: 'Audit Trail', path: '/audit', icon: 'file-text' },
      { label: 'Decision Log', path: '/decision-log', icon: 'check-square' },
      { label: 'Approval Rules', path: '/approval-rules', icon: 'check' },
    ],
  },
];
```

Voordeel van data-driven: Sidebar.tsx wordt één `map()` over deze structuur. Als je later een route toevoegt, wijzig je alleen dit ene bestand.

---

## Page titles voor Topbar

Map van pathname naar display-titel (voor Topbar):

```ts
// src/layout/pageTitles.ts
export const PAGE_TITLES: Record<string, string> = {
  '/':                        'Home',
  '/flight-overview':         'Flight Optimization — Overview',
  '/cockpit':                 'Cockpit',
  '/network-view':            'Network View',
  '/fare-recommender':        'Fare Recommender',
  '/weekly':                  'Weekly Performance',
  '/monthly':                 'Monthly Performance',
  '/decision-support':        'Decision Support',
  '/performance-analysis':    'Performance Analysis',
  '/customer-analytics':      'Customer Analytics',
  '/operational-impact':      'Operational Impact',
  '/margin-management':       'Margin Management',
  '/competitor-intel':        'Competitor Intel',
  '/distribution-channels':   'Distribution & Channels',
  '/overbooking':             'Overbooking',
  '/ancillary':               'Ancillary Management',
  '/budget-targets':          'Budget & Targets',
  '/audit':                   'Audit Trail',
  '/decision-log':            'Decision Log',
  '/approval-rules':          'Approval Rules',
};
```

---

## Nested-state patroon voor Business Overview

De Business Overview parent heeft 4 subgroups (Performance/Customer/Operations/Market) die ook expand/collapse zijn. Dat is 2 niveaus van nesting.

Voorgestelde state in `<Sidebar />`:

```tsx
const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['home']));
// Keys voor groups: 'flight-optimization', 'business-overview', 
//                   'business-management', 'settings'
// Keys voor subgroups (binnen Business Overview): 
//   'bo-performance', 'bo-customer', 'bo-operations', 'bo-market'
```

Een groep is "open" als de key in de Set zit. Toggle via `setOpenGroups(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; })`.

**Extra nicety:** open de groep waar de huidige route in zit automatisch bij paginalaad. Bijvoorbeeld: landen op `/weekly` opent automatisch Business Overview + Performance subgroup. Gebruik `useLocation` + een map van path → parent/subgroup.

---

## Verificatie aan het eind van stap 3

Test-checklist voor Claude Code aan het eind van route-implementatie:

- [ ] 20 routes bereikbaar via sidebar-klik
- [ ] 20 routes bereikbaar via directe URL (bv. `https://.../weekly`)
- [ ] Actieve nav-item correct gestyled (es-blue, border-right)
- [ ] Parent-groep correct open als child-route actief is
- [ ] Business Overview subgroep correct open als sub-child actief is
- [ ] Topbar-titel matcht de actieve route
- [ ] F5 / refresh behoudt huidige route
- [ ] Browser back/forward werkt door nav-geschiedenis
- [ ] 404-route toont fallback-pagina (niet blank screen)
