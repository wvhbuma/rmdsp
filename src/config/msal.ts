import {
  LogLevel,
  PublicClientApplication,
  type Configuration,
  type RedirectRequest,
} from '@azure/msal-browser'
import { getEntraConfig } from '@/config/env'

/*
 * MSAL-config voor Entra External ID (CIAM).
 * - `authority`: volledige URL incl. tenant (uit env)
 * - `knownAuthorities`: hostname van ciamlogin.com — MSAL vereist dit voor
 *   non-default authorities om DNS-spoofing te voorkomen
 * - `redirectUri`: window.location.origin — moet EXACT matchen met de
 *   "Single-page application" redirect-URI's in de Entra app registration
 *   (zowel http://localhost:5173 als de SWA-URL moeten zijn geregistreerd)
 *
 * Tokens in sessionStorage i.p.v. localStorage: tokens vervallen bij tab-close,
 * wat prettiger is voor gedeelde machines en minder XSS-oppervlak.
 */
function buildConfiguration(): Configuration | null {
  const entra = getEntraConfig()
  if (!entra) return null

  const authorityHost = new URL(entra.authorityUrl).host

  return {
    auth: {
      clientId: entra.clientId,
      authority: entra.authorityUrl,
      knownAuthorities: [authorityHost],
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'sessionStorage',
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return
          if (level === LogLevel.Error) {
            console.error('[MSAL]', message)
          }
        },
        logLevel: LogLevel.Warning,
      },
    },
  }
}

/*
 * Scopes voor login. Fase 0 heeft geen API-calls; openid/profile/email geeft
 * een ID-token met email-claim voor de Topbar. RAM API-scope komt in Fase 1.
 */
export const LOGIN_REQUEST: RedirectRequest = {
  scopes: ['openid', 'profile', 'email'],
}

/*
 * Singleton MSAL-instance. React StrictMode mount in dev dubbel; zonder
 * singleton zou initialize() twee keer runnen wat MSAL-state kan corrumperen.
 */
let cached: PublicClientApplication | null = null

export async function getMsalInstance(): Promise<PublicClientApplication | null> {
  if (cached) return cached
  const config = buildConfiguration()
  if (!config) return null
  const instance = new PublicClientApplication(config)
  await instance.initialize()
  cached = instance
  return instance
}
