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

export const ENTRA_TENANT_NAME: string | null = optional(
  import.meta.env.VITE_ENTRA_TENANT_NAME,
)

export const ENTRA_CLIENT_ID: string | null = optional(
  import.meta.env.VITE_ENTRA_CLIENT_ID,
)

export const ENTRA_AUTHORITY_URL: string | null = optional(
  import.meta.env.VITE_ENTRA_AUTHORITY_URL,
)

export const ENTRA_USER_FLOW: string | null = optional(
  import.meta.env.VITE_ENTRA_USER_FLOW,
)

/*
 * Type-guarded Entra-config voor MSAL. Gebruik binnen een `if` — de compiler
 * weet dan dat alle velden `string` zijn en geen null.
 */
export type EntraConfig = {
  tenantName: string
  clientId: string
  authorityUrl: string
  userFlow: string
}

export function getEntraConfig(): EntraConfig | null {
  if (
    ENTRA_TENANT_NAME === null ||
    ENTRA_CLIENT_ID === null ||
    ENTRA_AUTHORITY_URL === null ||
    ENTRA_USER_FLOW === null
  ) {
    return null
  }
  return {
    tenantName: ENTRA_TENANT_NAME,
    clientId: ENTRA_CLIENT_ID,
    authorityUrl: ENTRA_AUTHORITY_URL,
    userFlow: ENTRA_USER_FLOW,
  }
}

export function missingEntraVars(): string[] {
  const missing: string[] = []
  if (ENTRA_TENANT_NAME === null) missing.push('VITE_ENTRA_TENANT_NAME')
  if (ENTRA_CLIENT_ID === null) missing.push('VITE_ENTRA_CLIENT_ID')
  if (ENTRA_AUTHORITY_URL === null) missing.push('VITE_ENTRA_AUTHORITY_URL')
  if (ENTRA_USER_FLOW === null) missing.push('VITE_ENTRA_USER_FLOW')
  return missing
}
