/*
 * Drie-lagen route-model:
 *
 *   1. Route   — logische groepering, GEEN DB-entiteit (Prague / Paris / Milan).
 *   2. MarketID — DB-entiteit: een richting binnen een route (bv. "BEMI-PRA").
 *   3. Hidden MarketID — verborgen richting die meetelt met een zichtbare richting
 *      maar nooit als aparte optie in de UI verschijnt.
 *
 * Voorbeeld Paris: de tijdelijke omleiding via Berlin Gesundbrunnen (Q2 2026)
 * loopt over PNO-BGS / BGS-PNO. Die horen bij Route=Paris en tellen mee bij
 * respectievelijk PNO-BLS / BLS-PNO, maar worden niet apart getoond.
 *
 * Mapping hidden → zichtbare richting: een verborgen MarketID hoort bij de
 * zichtbare richting die het "anker"-station (de hub die in álle richtingen
 * voorkomt, hier PNO) op dezelfde positie heeft. PNO-BGS deelt origin PNO met
 * PNO-BLS; BGS-PNO deelt destination PNO met BLS-PNO.
 */

export interface RouteConfigEntry {
  /** Zichtbare richtingen (MarketIDs) die als filter-optie getoond worden. */
  directions: string[]
  /** Verborgen MarketIDs: tellen mee in de data, nooit los getoond. */
  hidden: string[]
}

export const ROUTE_CONFIG: Record<string, RouteConfigEntry> = {
  Prague: {
    directions: ['BEMI-PRA', 'PRA-BEMI'],
    hidden: [], // historisch: reed tot BHF (Berlin) t/m Q1 2024
  },
  Paris: {
    directions: ['PNO-BLS', 'BLS-PNO'],
    hidden: ['PNO-BGS', 'BGS-PNO'], // omleiding via Berlin, telt mee bij PNO-BLS/BLS-PNO
  },
  Milan: {
    directions: ['BEMI-MIL', 'MIL-BEMI'],
    hidden: [],
  },
}

/** Alle route-namen (Prague / Paris / Milan), in config-volgorde. */
export const CATALOG_ROUTES: string[] = Object.keys(ROUTE_CONFIG)

/** Zichtbare richtingen van een route (leeg als route onbekend is). */
export function visibleDirections(route: string): string[] {
  return ROUTE_CONFIG[route]?.directions ?? []
}

/** Alle MarketIDs van een route: zichtbaar + verborgen. */
export function allMarketIds(route: string): string[] {
  const entry = ROUTE_CONFIG[route]
  return entry ? [...entry.directions, ...entry.hidden] : []
}

function endpoints(marketId: string): [string, string] {
  const [origin, destination] = marketId.split('-')
  return [origin, destination]
}

/**
 * Het anker-station van een route: het station dat in élke MarketID voorkomt
 * (de hub). Voor Paris is dat PNO. null als er geen gemeenschappelijk station is.
 */
function anchorStation(route: string): string | null {
  const ids = allMarketIds(route)
  if (ids.length === 0) return null
  const stationSets = ids.map((id) => new Set(endpoints(id)))
  for (const station of stationSets[0]) {
    if (stationSets.every((set) => set.has(station))) return station
  }
  return null
}

/**
 * Alle MarketIDs waarop gefilterd moet worden voor een gekozen zichtbare
 * richting: de richting zelf + de verborgen MarketIDs die op dezelfde
 * anker-positie liggen.
 *
 * Bv. marketsForDirection('Paris', 'PNO-BLS') → ['PNO-BLS', 'PNO-BGS']
 *     marketsForDirection('Paris', 'BLS-PNO') → ['BLS-PNO', 'BGS-PNO']
 */
export function marketsForDirection(route: string, direction: string): string[] {
  const entry = ROUTE_CONFIG[route]
  if (!entry || entry.hidden.length === 0) return [direction]

  const anchor = anchorStation(route)
  if (anchor === null) return [direction]

  const [dirOrigin] = endpoints(direction)
  const anchorIsOrigin = dirOrigin === anchor

  const result = [direction]
  for (const hidden of entry.hidden) {
    const [hOrigin, hDest] = endpoints(hidden)
    const matches = anchorIsOrigin ? hOrigin === anchor : hDest === anchor
    if (matches) result.push(hidden)
  }
  return result
}
