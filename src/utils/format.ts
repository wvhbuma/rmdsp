/*
 * Formatter-helpers voor de displacement-UI. Locale nl-NL (European Sleeper is
 * Nederlandstalig): duizendtallen met punt, decimaal met komma.
 */

const eurFull = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const numFull = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })

/** Volledige euro-weergave, geen decimalen: "€ 1.234.567". */
export function formatCurrency(n: number): string {
  return eurFull.format(Math.round(n))
}

/** Compacte euro-weergave voor KPI-cards: "€1,2M", "€845K". */
export function formatCurrencyCompact(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}€${Math.round(abs / 1_000)}K`
  return `${sign}€${Math.round(abs)}`
}

/** Percentage met 1 decimaal: "12,3%". Invoer is al een percentage (0–100). */
export function formatPct(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace('.', ',')}%`
}

/** Load factor (fractie 0–1) → percentage: 0.873 → "87%". */
export function formatLf(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits).replace('.', ',')}%`
}

/** Geheel getal met groepering: "12.345". */
export function formatNumber(n: number): string {
  return numFull.format(Math.round(n))
}
