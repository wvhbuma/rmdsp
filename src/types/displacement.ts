/*
 * Types voor de Multi-Leg Displacement Analysis.
 *
 * Deze spiegelen exact de JSON-respons van GET {VITE_RAM_API_BASE_URL}/api/displacement.
 * Alle revenue-velden zijn in euro's, lf (load factor) is een fractie 0–1.
 *
 * NB: `cabin` is een string (niet een union) omdat de set cabins datagestuurd is
 * via DisplacementResponse.cabins. Voor labels/kleuren/volgorde gebruik je de
 * helpers in @/config/displacement (die vallen veilig terug op de code zelf).
 */

export interface DisplacementSummary {
  market: string
  route: string
  month: string
  bedRevenue: number
  bedDisplacement: number
  bedDisplacementPct: number
  bedDepartures: number
  bedConstrained: number
  seatRevenue: number
  seatDisplacement: number
  seatDepartures: number
  seatConstrained: number
  totalRevenue: number
  totalDisplacement: number
  totalDisplacementPct: number
}

export interface DisplacementDeparture {
  market: string
  route: string
  month: string
  date: string // "YYYY-MM-DD"
  cabin: string // "CHT" | "SEA" | "CMF" | "SLP"
  type: 'bed' | 'seat'
  capacity: number
  units: number
  lf: number // 0–1
  constrained: boolean
  actual: number // FIFO-revenue
  optimal: number // yield-optimale revenue
  displacement: number // optimal - actual
}

export interface DisplacementOD {
  market: string
  route: string
  month: string
  od: string // "BEMI → PRA"
  cabin: string
  zone: number
  units: number
  avgFare: number
  category: string // "villain" | "victim"
}

export interface LegData {
  leg: number
  label: string // "BEMI→ANCT"
  board: number
  through: number
  alight: number
  onboard: number
}

export interface DisplacementLeg {
  market: string
  route: string
  month: string
  date: string
  cabin: string
  legs: LegData[]
}

export interface DisplacementResponse {
  summary: DisplacementSummary[]
  departures: DisplacementDeparture[]
  od: DisplacementOD[]
  legs: DisplacementLeg[]
  months: string[] // ["Apr 2025", "May 2025", ...]
  cabins: string[] // ["CHT", "CMF", "SEA", "SLP"]
  routes: Record<string, string[]> // {"Prague": ["BEMI-PRA","PRA-BEMI"], ...}
  markets: string[]
  stationNames: Record<string, string> // {"BEMI": "Brussels", ...}
  _meta?: {
    generated: string
    markets: string[]
    n_months: number
    n_departures: number
    n_od: number
    n_legs: number
  }
}

/** O&D-categorieën zoals de engine ze labelt. */
export type OdCategory = 'villain' | 'victim'
