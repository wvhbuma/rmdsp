/*
 * Route-catalogus: de routes die de organisatie aanbiedt, met hun richtingen.
 * Dit is de bron voor de Route Assignment-sectie in User Preferences en bepaalt
 * (na toewijzing) welke routes in de filter-dropdowns verschijnen.
 *
 * NB: dit is bewust een statische catalogus, los van wat er toevallig in de
 * displacement-dataset zit. Een route verschijnt pas in een filter-dropdown als
 * hij (a) in deze catalogus staat én toegewezen is, én (b) in de data voorkomt.
 */

export interface RouteDirection {
  /** Directionele code zoals in de data, bv. "BEMI-PRA". */
  code: string
  /** Leesbaar label, bv. "Brussel → Praag". */
  label: string
}

export interface RouteCatalogEntry {
  /** Markt-/route-naam zoals in DisplacementResponse.markets, bv. "Prague". */
  market: string
  directions: RouteDirection[]
}

export const ROUTE_CATALOG: RouteCatalogEntry[] = [
  {
    market: 'Prague',
    directions: [
      { code: 'BEMI-PRA', label: 'Brussel → Praag' },
      { code: 'PRA-BEMI', label: 'Praag → Brussel' },
    ],
  },
  {
    market: 'Paris',
    directions: [
      { code: 'BEMI-PAR', label: 'Brussel → Parijs' },
      { code: 'PAR-BEMI', label: 'Parijs → Brussel' },
    ],
  },
  {
    market: 'Milan',
    directions: [
      { code: 'BEMI-MIL', label: 'Brussel → Milaan' },
      { code: 'MIL-BEMI', label: 'Milaan → Brussel' },
    ],
  },
]

/** Alle markt-namen uit de catalogus. */
export const CATALOG_MARKETS: string[] = ROUTE_CATALOG.map((r) => r.market)

/** Alle directionele codes uit de catalogus. */
export const CATALOG_DIRECTIONS: string[] = ROUTE_CATALOG.flatMap((r) =>
  r.directions.map((d) => d.code),
)
