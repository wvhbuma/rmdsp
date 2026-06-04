/*
 * Types voor de Seasonal Planner.
 *
 * Spiegelen de JSON van de Flask seasonal-API (zie SEASONAL_PLANNER_RMDSP_PLAN.md
 * §3). Cabin-mapping gelijk aan displacement (SEA=Budget, CHT=Classic,
 * CMF=Comfort Standard, SLP=Comfort Plus).
 */

// ── Enums ──
export type CabinCode = 'CHT' | 'SEA' | 'SLP' | 'CMF'
export type ProfileName = 'High' | 'Med' | 'Low'
export type TargetBinding =
  | 'elasticity'
  | 'yield_floor'
  | 'high_lf_bonus'
  | 'oversell_py'
  | 'no_growth'
  | 'no_py_data'
export type GapFillMethod = 'matched' | 'cmf_slp_proxy' | 'cabin_avg' | 'missing'
export type MaskPhase = 'open' | 'protected' | 'start' | 'closed' | 'non-nested'

// ── Core data ──
export interface SeasonalTarget {
  key: string
  productId: number
  market: string
  modelCabin: CabinCode
  departureDate: string
  capacity: number
  targetUnits: number
  targetLf: number
  targetYield: number
  targetRevenue: number
  targetRau: number
  targetBinding: TargetBinding
  profile: ProfileName
  startRbd: string
  pyUnitsSold: number
  pyYield: number
  pyRevenue: number
  pyLf: number
  /** Optioneel: PY-capaciteit. Afwezig → afgeleid uit pyUnitsSold / pyLf. */
  pyCapacity?: number
  pyGapFill: GapFillMethod
  pyMatchMethod: 'dow' | 'nearest'
}

export interface SeasonalMask {
  key: string
  productId: number
  market: string
  modelCabin: CabinCode
  departureDate: string
  rbd: string
  fare: number
  protection: number
  auCum: number
  phase: MaskPhase
}

export interface SeasonalSimulation {
  key: string
  market: string
  modelCabin: CabinCode
  departureDate: string
  capacity: number
  targetUnits: number
  targetYield: number
  naiveRevenue: number
  simRevenue: number
  simYield: number
  simLf: number
  fullCapRevenue: number
  revenueDelta: number
  revenueDeltaPct: number
  zoneDiscount: number
}

// ── API responses ──
export interface DiscoverResponse {
  routes: Record<
    string,
    {
      cabins: Array<{
        code: CabinCode
        name: string
        products: number
        avgCapacity: number
      }>
      totalProducts: number
      minDate: string
      maxDate: string
    }
  >
  period: { start: string; end: string }
}

export interface PipelineSummary {
  step: string
  products?: { count: number; routes: string[]; cabins: string[]; dates: string }
  pyMatch?: { total: number; gapFill: Record<string, number> }
  targets?: {
    count: number
    totalUnits: number
    totalRevenue: number
    avgLf: number
    avgYield: number
    bindings: Record<string, number>
    profiles: Record<string, number>
  }
}

export interface PipelineResponse {
  status: 'ok' | 'error'
  summary: PipelineSummary
  excel: string
}

/** Sessie-info bij de laatst berekende resultaten (uit het _session veld). */
export interface SeasonalSessionInfo {
  name: string
  routes: string[]
  seasonStart: string
  seasonEnd: string
}

export interface SeasonalResults {
  targets: SeasonalTarget[]
  masks: SeasonalMask[]
  sim: SeasonalSimulation[]
  /** Aanwezig in /api/seasonal/results/latest; beschrijft de huidige sessie. */
  _session?: SeasonalSessionInfo
}

/** Eén CY-product/vertrek uit /api/seasonal/products. */
export interface SeasonalProduct {
  productId: number
  date: string
  trainNumber: string
  market: string
  modelCabin: CabinCode
}

export interface ProductsResponse {
  products: SeasonalProduct[]
}

// ── Config ──
export interface DestinationConfig {
  routes: string[]
  yieldMultiplier: number
  elasticities: Record<string, Record<CabinCode, number>> // month → cabin → ε
  constraints: {
    targetLfCeiling: number
    maxYieldDecline: number
    highLfThreshold: number
    highLfYieldBonus: number
  }
  zoneDiscounts: Record<CabinCode, number>
}

export interface SeasonalConfig {
  destinations: Record<string, DestinationConfig>
}

// ── Request payloads ──

/** Profieltoekenning per vertrek, meegegeven aan de pipeline. */
export interface ProfileAssignment {
  date: string
  market: string
  profile: ProfileName
}

export interface RunPipelineArgs {
  name: string
  routes: string[]
  start: string
  end: string
  config?: Partial<SeasonalConfig>
  profileAssignments?: ProfileAssignment[]
}

/*
 * Geen apiKey hier: de RAM API key zit server-side (env RAM_API_KEY) en wordt
 * door het Flask implement-endpoint afgehandeld. De frontend stuurt 'm niet mee.
 */
export interface ImplementArgs {
  routes?: string[]
  cabins?: string[]
  dryRun?: boolean
}

export interface ImplementResult {
  status: 'ok' | 'error'
  dryRun: boolean
  pushed: number
  skipped: number
  log: string[]
}

/** Een bestaand seizoen (Excel-bestand) zoals opgelijst door /api/seasonal/sessions. */
export interface SeasonalSession {
  name: string
  file?: string
  modified?: string
  products?: number
}
