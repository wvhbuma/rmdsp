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
import { marketsForDirection } from '@/config/routes'

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

/*
 * De MarketIDs waarop een gekozen richting filtert. 'all' → null (geen
 * richting-constraint, alleen de route/markt telt). Een specifieke richting →
 * die richting + bijbehorende verborgen MarketIDs (bv. de Paris-omleiding).
 */
export function allowedRouteMarkets(
  filter: DisplacementFilter,
): Set<string> | null {
  if (filter.route === 'all') return null
  return new Set(marketsForDirection(filter.market, filter.route))
}

function matchesBase(
  row: RowLike,
  filter: DisplacementFilter,
  months: Set<string>,
  allowed: Set<string> | null,
): boolean {
  if (filter.market && row.market !== filter.market) return false
  if (allowed && !allowed.has(row.route)) return false
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
  const allowed = allowedRouteMarkets(filter)
  return data.summary.filter((r) => matchesBase(r, filter, months, allowed))
}

export function filterDepartures(
  data: DisplacementResponse,
  filter: DisplacementFilter,
  months: Set<string>,
): DisplacementDeparture[] {
  const allowed = allowedRouteMarkets(filter)
  return data.departures.filter(
    (r) => matchesBase(r, filter, months, allowed) && matchesCabin(r.cabin, filter),
  )
}

export function filterOd(
  data: DisplacementResponse,
  filter: DisplacementFilter,
  months: Set<string>,
): DisplacementOD[] {
  const allowed = allowedRouteMarkets(filter)
  return data.od.filter(
    (r) => matchesBase(r, filter, months, allowed) && matchesCabin(r.cabin, filter),
  )
}

export function filterLegs(
  data: DisplacementResponse,
  filter: DisplacementFilter,
  months: Set<string>,
): DisplacementLeg[] {
  const allowed = allowedRouteMarkets(filter)
  return data.legs.filter(
    (r) => matchesBase(r, filter, months, allowed) && matchesCabin(r.cabin, filter),
  )
}

/** Som van een numeriek veld over een rij-array. */
export function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((acc, r) => acc + pick(r), 0)
}

/**
 * Reconstrueert summary-rijen (één per markt/route/maand) uit departure-rijen.
 *
 * De API levert `summary` als voor-aggregatie van `departures` over álle cabins;
 * de summary heeft dus géén cabin-dimensie en kan niet op cabin gefilterd worden.
 * Deze helper bouwt dezelfde summary-vorm op uit de (wél cabin-filterbare)
 * departures, zodat trend/KPI's/piekmaand/tabel op de cabin-selectie reageren —
 * net als de donut.
 *
 * Aannames, geverifieerd tegen de dataset (afwijking = alleen float-afronding):
 * - bed/seat-split komt uit `type`
 * - revenue = som van `actual` (FIFO-revenue), NIET `optimal` (yield-optimaal)
 * - displacement = som van `displacement`
 * - *Departures = aantal departure-rijen van dat type
 * - *Constrained = aantal rijen met `constrained === true`
 *
 * Bij cabins:[] reproduceert dit de originele summary-getallen per maand.
 * Percentages worden opnieuw berekend (die mag je niet sommeren).
 */
export function summarizeDepartures(
  departures: DisplacementDeparture[],
): DisplacementSummary[] {
  const byKey = new Map<string, DisplacementSummary>()
  for (const d of departures) {
    const key = `${d.market}|${d.route}|${d.month}`
    let row = byKey.get(key)
    if (row === undefined) {
      row = {
        market: d.market,
        route: d.route,
        month: d.month,
        bedRevenue: 0,
        bedDisplacement: 0,
        bedDisplacementPct: 0,
        bedDepartures: 0,
        bedConstrained: 0,
        seatRevenue: 0,
        seatDisplacement: 0,
        seatDepartures: 0,
        seatConstrained: 0,
        totalRevenue: 0,
        totalDisplacement: 0,
        totalDisplacementPct: 0,
      }
      byKey.set(key, row)
    }
    if (d.type === 'bed') {
      row.bedRevenue += d.actual
      row.bedDisplacement += d.displacement
      row.bedDepartures += 1
      if (d.constrained) row.bedConstrained += 1
    } else {
      row.seatRevenue += d.actual
      row.seatDisplacement += d.displacement
      row.seatDepartures += 1
      if (d.constrained) row.seatConstrained += 1
    }
    row.totalRevenue += d.actual
    row.totalDisplacement += d.displacement
  }
  for (const row of byKey.values()) {
    row.bedDisplacementPct =
      row.bedRevenue > 0 ? (row.bedDisplacement / row.bedRevenue) * 100 : 0
    row.totalDisplacementPct =
      row.totalRevenue > 0 ? (row.totalDisplacement / row.totalRevenue) * 100 : 0
  }
  return [...byKey.values()]
}
