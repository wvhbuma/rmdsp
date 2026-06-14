import type { ReactNode } from 'react'
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from '@azure/msal-react'
import { Login } from '@/pages/Login'

/*
 * Splits children tussen ingelogd en uitgelogd.
 * - AuthenticatedTemplate rendert alleen als er een actieve MSAL-account is
 * - UnauthenticatedTemplate rendert alleen als er géén account is
 * - Tijdens de kortstondige interactie (redirect-resolve) rendert MSAL niets
 *   — dat voorkomt flash-of-login-page bij refresh met geldige sessie
 */
export function AuthGate({ children }: { children: ReactNode }) {
  // Dev-only ontsnapping: VITE_DEV_NO_AUTH=true slaat de Entra-login over zodat
  // v2-pagina's lokaal visueel getest kunnen worden zonder live sessie.
  // NOOIT in productie of CI zetten (env wordt build-time ingebakken).
  if (import.meta.env.VITE_DEV_NO_AUTH === 'true') {
    return <>{children}</>
  }

  return (
    <>
      <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
    </>
  )
}
