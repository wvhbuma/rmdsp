/*
 * Type-safe env-var reader.
 * Vite vervangt import.meta.env.VITE_* statisch tijdens build, dus we moeten
 * elke variabele per naam referentieren — dynamische access (env[name]) werkt
 * niet in productie-bundles.
 *
 * We falen soft: ontbrekende env-vars worden als `null` geëxporteerd, niet
 * als error. De component die de waarde gebruikt (bv. SystemStatus) toont
 * dan een "not configured" state. Dat is prettiger voor dev dan een crash.
 */

function optional(raw: string | undefined): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length === 0 ? null : trimmed
}

export const RAM_API_BASE_URL: string | null = optional(
  import.meta.env.VITE_RAM_API_BASE_URL,
)
