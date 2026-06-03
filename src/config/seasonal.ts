/*
 * Presentatie-config voor de Seasonal Planner.
 *
 * Cabin-mapping is identiek aan displacement — we her-exporteren die bewust uit
 * één bron (config/displacement) zodat de twee modules nooit uit sync raken.
 * De seizoen-specifieke maps (RBD, mask-phases, bindings, profielen) staan hier.
 */
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

/** Leesbare labels per target-binding (waarom een target zo uitkomt). */
export const BINDING_LABELS: Record<string, string> = {
  elasticity: 'Elasticiteit',
  yield_floor: 'Yield Floor',
  high_lf_bonus: 'High-LF Bonus',
  oversell_py: 'Oversell (PY)',
  no_growth: 'Geen groei',
  no_py_data: 'Geen PY data',
}

/** Kleur per vraag-profiel (High/Med/Low). */
export const PROFILE_COLORS: Record<string, string> = {
  High: '#C92EC9',
  Med: '#0077FF',
  Low: '#6D6E71',
}
