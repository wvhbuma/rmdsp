/*
 * Presentatie-config voor de Seasonal Planner.
 *
 * Cabin-mapping is identiek aan displacement — we her-exporteren die bewust uit
 * één bron (config/displacement) zodat de twee modules nooit uit sync raken.
 * De seizoen-specifieke maps (RBD, mask-phases, bindings, profielen) staan hier.
 */
import type { ProfileName, StartRbdTable } from '@/types/seasonal'

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
