/*
 * Presentatie-config voor de Seasonal Planner.
 *
 * Cabin-mapping is identiek aan displacement — we her-exporteren die bewust uit
 * één bron (config/displacement) zodat de twee modules nooit uit sync raken.
 * De seizoen-specifieke maps (RBD, mask-phases, bindings, profielen) staan hier.
 */
import type {
  AllocationConfig,
  AllocationMethod,
  CabinCode,
  ConstraintSet,
  DemandBasis,
  DestinationConfig,
  ProfileName,
  SeasonalConfig,
  SeasonalConfigWire,
  StartRbdTable,
} from '@/types/seasonal'

export { CABIN_LABELS, CABIN_ORDER, CABIN_COLORS } from '@/config/displacement'

/** Booking-class volgorde (hoog → laag), gebruikt voor mask-tabellen/charts. */
export const RBD_ORDER = ['J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'T', 'W', 'V']

/** Kleur per mask-phase voor de AU-distributie chart. */
export const MASK_PHASE_COLORS: Record<string, string> = {
  open: '#0077FF',
  protected: '#C92EC9',
  start: '#0A1628',
  closed: '#dfe3e8',
}

/** Readable labels per target-binding (why a target ends up where it does). */
export const BINDING_LABELS: Record<string, string> = {
  elasticity: 'Elasticity',
  yield_floor: 'Yield Floor',
  high_lf_bonus: 'High-LF Bonus',
  oversell_py: 'Oversell (PY)',
  no_growth: 'No growth',
  no_py_data: 'No PY data',
}

/** Kleur per vraag-profiel (High/Med/Low). */
export const PROFILE_COLORS: Record<string, string> = {
  High: '#C92EC9',
  Med: '#0077FF',
  Low: '#6D6E71',
}

export const PROFILE_ORDER: ProfileName[] = ['High', 'Med', 'Low']

/** Nested booking classes, laag → hoog. Bepaalt de keuzelijst voor start-RBD. */
export const NESTED_RBD_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

/** Vaste terugval als de config geen start-RBD's bevat — spiegelt config.py. */
export const DEFAULT_START_RBDS: Record<ProfileName, string> = {
  High: 'D',
  Med: 'C',
  Low: 'B',
}

/** De "alle routes × alle cabines"-regel uit een startRbds-tabel. */
export function defaultStartRbds(table: StartRbdTable | undefined): Record<ProfileName, string> {
  const row = table?.['*']?.['*'] ?? {}
  return {
    High: row.High ?? DEFAULT_START_RBDS.High,
    Med: row.Med ?? DEFAULT_START_RBDS.Med,
    Low: row.Low ?? DEFAULT_START_RBDS.Low,
  }
}

/** Compacte weergave "D / C / B" voor recap-tabellen. */
export function formatDefaultStartRbds(table: StartRbdTable | undefined): string {
  const r = defaultStartRbds(table)
  return `${r.High} / ${r.Med} / ${r.Low}`
}

interface StartRbdOverride {
  route: string
  cabin: string
  rbds: Partial<Record<ProfileName, string>>
}

/*
 * Alle regels die afwijken van "*"/"*", als platte lijst. Die kunnen alleen via
 * een handmatig config-bestand ontstaan; de UI toont ze read-only zodat ze niet
 * onzichtbaar zijn.
 */
export function startRbdOverrides(table: StartRbdTable | undefined): StartRbdOverride[] {
  if (!table) return []
  const out: StartRbdOverride[] = []
  for (const [route, byCabin] of Object.entries(table)) {
    for (const [cabin, rbds] of Object.entries(byCabin ?? {})) {
      if (route === '*' && cabin === '*') continue
      out.push({ route, cabin, rbds })
    }
  }
  return out
}

/* ── Maandelijkse config ──────────────────────────────────────────────────── */

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const MONTH_SET = new Set<string>(MONTHS)

/** Maandnaam bij een ISO-datum ("2027-11-14" → "Nov"); leeg bij een rare datum. */
export function monthNameOf(isoDate: string): string {
  const m = Number(isoDate?.slice(5, 7))
  return m >= 1 && m <= 12 ? MONTHS[m - 1] : ''
}

/*
 * Terugval als de config geen allocation-blok heeft — spiegelt
 * DEFAULT_ALLOCATION in config.py: het oorspronkelijke profielmodel, zodat een
 * ouder config-bestand niet ineens van model verandert.
 */
export const DEFAULT_ALLOCATION: AllocationConfig = {
  method: 'profile',
  demandBasis: 'capacity',
}

export const ALLOCATION_LABELS: Record<AllocationMethod, string> = {
  profile: 'Profile percentages',
  emsrb: 'EMSR-b',
}

export const DEMAND_BASIS_LABELS: Record<DemandBasis, string> = {
  capacity: 'Capacity',
  target: 'Target units',
}

export const DEFAULT_CONSTRAINTS: ConstraintSet = {
  targetLfCeiling: 0.95,
  maxYieldDecline: 0.15,
  highLfThreshold: 0.9,
  highLfYieldBonus: 0.1,
}

export const DEFAULT_ZONE_DISCOUNTS: Record<CabinCode, number> = {
  SEA: 1.0,
  CHT: 0.95,
  CMF: 0.9,
  SLP: 0.85,
}

/*
 * Vouw een config-blok uit naar maand → waarde. Spiegelt expand_monthly() in
 * config.py: een blok met maandsleutels blijft zoals het is (ontbrekende maanden
 * krijgen de fallback), een plat blok geldt voor alle twaalf maanden.
 */
export function expandMonthly<T>(raw: unknown, fallback: T): Record<string, T> {
  const out: Record<string, T> = {}
  if (raw && typeof raw === 'object') {
    const entries = Object.entries(raw as Record<string, unknown>)
    const monthly = entries.filter(([k, v]) => MONTH_SET.has(k) && v && typeof v === 'object')
    if (monthly.length > 0) {
      for (const [month, value] of monthly) out[month] = { ...(value as object) } as T
    } else if (entries.length > 0) {
      for (const month of MONTHS) out[month] = { ...(raw as object) } as T
    }
  }
  for (const month of MONTHS) {
    if (!out[month]) out[month] = { ...fallback }
  }
  return out
}

/*
 * Normaliseer een config zoals hij van schijf of uit een geüpload bestand komt.
 * Na deze stap heeft elke bestemming alle twaalf maanden voor elasticiteiten,
 * constraints en zone-discounts — zodat de UI en de engine hetzelfde beeld
 * hebben en er nergens stilzwijgend een default kan winnen.
 */
export function normalizeSeasonalConfig(wire: SeasonalConfigWire): SeasonalConfig {
  const destinations: Record<string, DestinationConfig> = {}

  for (const [name, d] of Object.entries(wire.destinations ?? {})) {
    const elasticities = expandMonthly<Record<CabinCode, number>>(d.elasticities, {
      SEA: -1.2,
      CHT: -0.7,
      CMF: -0.6,
      SLP: -0.4,
    })
    destinations[name] = {
      routes: d.routes ?? [],
      yieldMultiplier: d.yieldMultiplier ?? 1.0,
      startRbds: d.startRbds ?? { '*': { '*': { ...DEFAULT_START_RBDS } } },
      allocation: {
        method: d.allocation?.method ?? DEFAULT_ALLOCATION.method,
        demandBasis: d.allocation?.demandBasis ?? DEFAULT_ALLOCATION.demandBasis,
      },
      elasticities,
      constraints: expandMonthly<ConstraintSet>(d.constraints, DEFAULT_CONSTRAINTS),
      zoneDiscounts: expandMonthly<Record<CabinCode, number>>(
        d.zoneDiscounts,
        DEFAULT_ZONE_DISCOUNTS,
      ),
    }
  }

  return { destinations }
}
