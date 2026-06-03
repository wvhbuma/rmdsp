/*
 * Presentatie-config voor de Displacement-pagina's: cabin-labels, -kleuren en
 * -volgorde, plus korte stationsnamen. De engine levert codes (SEA/CHT/CMF/SLP,
 * BEMI/ANCT/…); deze maps vertalen die naar wat de UI toont.
 *
 * Voor lange stationsnamen (Brussels, Antwerp, …) gebruiken we
 * DisplacementResponse.stationNames uit de API — die is datagestuurd en kan per
 * markt verschillen. STATION_SHORT hieronder is de vaste afkorting voor charts.
 */

/** Cabin-code → leesbaar label. */
export const CABIN_LABELS: Record<string, string> = {
  SEA: 'Budget',
  CHT: 'Classic',
  CMF: 'Comfort Standard',
  SLP: 'Comfort Plus',
}

/** Volgorde waarin cabins in legendes, tabs en tabellen verschijnen. */
export const CABIN_ORDER = ['SEA', 'CHT', 'CMF', 'SLP'] as const

/** Cabin-code → merkkleur (donut, legendes, tabs). */
export const CABIN_COLORS: Record<string, string> = {
  SEA: '#0d9e4f',
  CHT: '#0077FF',
  CMF: '#e07a00',
  SLP: '#C92EC9',
}

/** Stationscode → korte afkorting voor charts/heatmap (BEMI → BRU). */
export const STATION_SHORT: Record<string, string> = {
  BEMI: 'BRU',
  ANCT: 'ANC',
  RTD: 'RTD',
  GVC: 'GVC',
  SHL: 'SHL',
  ASD: 'ASD',
  ASB: 'ASB',
  ASDZ: 'ASDZ',
  UT: 'UT',
  AMF: 'AMF',
  DV: 'DV',
  HB: 'HB',
  BGS: 'BGS',
  BHF: 'BHF',
  BLS: 'BLS',
  DD: 'DD',
  DDN: 'DDN',
  DBS: 'DBS',
  DC: 'DC',
  UL: 'UL',
  PH: 'PH',
  PRA: 'PRA',
  PNO: 'PNO',
  MIL: 'MIL',
}

/** ES-merkkleuren + displacement-specifieke kleuren (zie prompt-spec). */
export const COLORS = {
  esBlue: '#0077FF',
  esMagenta: '#C92EC9',
  dark: '#1a1a2e',
  gray: '#6D6E71',
  grayLight: '#EDF0F2',
  bars: '#6D6E71', // displacement-bars
  line: '#3A3A3A', // displacement-lijn
  villain: '#d63031',
  victim: '#0d9e4f',
  victimCard: '#0077FF',
} as const

/*
 * Tailwind-classes per cabin (DOM-styling — geen inline style). De literals
 * staan hier expliciet zodat Tailwind v4 ze bij het scannen oppikt; dynamische
 * lookup via deze map is daardoor veilig.
 */
const CABIN_BG_CLASS: Record<string, string> = {
  SEA: 'bg-cabin-sea',
  CHT: 'bg-cabin-cht',
  CMF: 'bg-cabin-cmf',
  SLP: 'bg-cabin-slp',
}

/** Fallback: onbekende cabin-code toont gewoon de code zelf. */
export function cabinLabel(code: string): string {
  return CABIN_LABELS[code] ?? code
}

/** Hex-kleur voor cabin — voor ECharts-opties (JS, geen DOM-styling). */
export function cabinColor(code: string): string {
  return CABIN_COLORS[code] ?? COLORS.gray
}

/** Tailwind bg-class voor cabin — voor DOM-elementen (dots, tabs). */
export function cabinBgClass(code: string): string {
  return CABIN_BG_CLASS[code] ?? 'bg-rm-gray'
}

/** Korte stationsnaam; valt terug op de code zelf. */
export function stationShort(code: string): string {
  return STATION_SHORT[code] ?? code
}

/**
 * Sorteer een lijst cabin-codes volgens CABIN_ORDER. Codes buiten de volgorde
 * komen achteraan (alfabetisch), zodat onbekende cabins niet zoekraken.
 */
export function sortCabins(codes: string[]): string[] {
  const order = CABIN_ORDER as readonly string[]
  return [...codes].sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}
