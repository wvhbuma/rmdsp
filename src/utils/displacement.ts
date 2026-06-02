/*
 * Filter- en aggregatie-helpers voor de displacement-pagina's.
 *
 * De volledige dataset komt in één call binnen (zie useDisplacement); hier
 * filteren we client-side op markt/route/cabin/periode. De pagina's doen daarna
 * hun eigen aggregaties (KPI's, donut, scatter) op de gefilterde subsets.
 */
import type {
  DisplacementDeparture,
  DisplacementLeg,
  DisplacementOD,
  DisplacementResponse,
  DisplacementSummary,
} from '@/types/displacement'

export type PeriodMode = 'multi' | 'single'

export interface DisplacementFilter {
  market: string
  route: string | 'all' // directionele route-code of 'all' (beide richtingen)
  cabins: string[] // leeg = alle cabins
  year: number | 'all'
  months: string[] // geselecteerde maand-labels; leeg = alle (binnen jaar)
}

/** "Apr 2025" → 2025. Valt terug op 0 als er geen jaartal in zit. */
export function getYear(month: string): number {
  const m = month.match(/(\d{4})/)
  return m ? Number(m[1]) : 0
}

/** Unieke jaartallen uit de maand-labels, oplopend gesorteerd. */
export function listYears(months: string[]): number[] {
  const set = new Set(months.map(getYear))
  return [...set].sort((a, b) => a - b)
}

/** Maand-labels binnen een jaar (of alle als year === 'all'), in dataset-volgorde. */
export function monthsForYear(months: string[], year: number | 'all'): string[] {
  if (year === 'all') return months
  return months.filter((m) => getYear(m) === year)
}

/**
 * De effectieve set maanden waarop gefilterd wordt: expliciet gekozen maanden,
 * anders alle maanden in het gekozen jaar.
 */
export function effectiveMonths(
  data: DisplacementResponse,
  filter: DisplacementFilter,
): Set<string> {
  if (filter.months.length > 0) return new Set(filter.months)
  return new Set(monthsForYear(data.months, filter.year))
}

/** Routes (richtingen) beschikbaar voor de gekozen markt. */
export function routesForMarket(
  data: DisplacementResponse,
  market: string,
): string[] {
  return data.routes[market] ?? []
}

/**
 * Default-filter bij eerste load: eerste markt, beide richtingen, alle cabins,
 * en de periode-keuze hangt af van de modus (multi: heel laatste jaar, single:
 * laatste maand).
 */
export function defaultFilter(
  data: DisplacementResponse,
  mode: PeriodMode,
): DisplacementFilter {
  const market = data.markets[0] ?? ''
  const years = listYears(data.months)
  const lastYear = years.length > 0 ? years[years.length - 1] : 'all'
  if (mode === 'single') {
    const monthsLastYear = monthsForYear(data.months, lastYear)
    const lastMonth = monthsLastYear[monthsLastYear.length - 1]
    return {
      market,
      route: 'all',
      cabins: [],
      year: lastYear,
      months: lastMonth ? [lastMonth] : [],
    }
  }
  return { market, route: 'all', cabins: [], year: lastYear, months: [] }
}

interface RowLike {
  market: string
  route: string
  month: string
}

function matchesBase(
  row: RowLike,
  filter: DisplacementFilter,
  months: Set<string>,
): boolean {
  if (filter.market && row.market !== filter.market) return false
  if (filter.route !== 'all' && row.route !== filter.route) return false
  if (!months.has(row.month)) return false
  return true
}

function matchesCabin(cabin: string, filter: DisplacementFilter): boolean {
  return filter.cabins.length === 0 || filter.cabins.includes(cabin)
}

export function filterSummary(
  data: DisplacementResponse,
  filter: DisplacementFilter,
  months: Set<string>,
): DisplacementSummary[] {
  // Summary heeft geen cabin-dimensie (bed/seat zit in de kolommen zelf).
  return data.summary.filter((r) => matchesBase(r, filter, months))
}

export function filterDepartures(
  data: DisplacementResponse,
  filter: DisplacementFilter,
  months: Set<string>,
): DisplacementDeparture[] {
  return data.departures.filter(
    (r) => matchesBase(r, filter, months) && matchesCabin(r.cabin, filter),
  )
}

export function filterOd(
  data: DisplacementResponse,
  filter: DisplacementFilter,
  months: Set<string>,
): DisplacementOD[] {
  return data.od.filter(
    (r) => matchesBase(r, filter, months) && matchesCabin(r.cabin, filter),
  )
}

export function filterLegs(
  data: DisplacementResponse,
  filter: DisplacementFilter,
  months: Set<string>,
): DisplacementLeg[] {
  return data.legs.filter(
    (r) => matchesBase(r, filter, months) && matchesCabin(r.cabin, filter),
  )
}

/** Som van een numeriek veld over een rij-array. */
export function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((acc, r) => acc + pick(r), 0)
}
