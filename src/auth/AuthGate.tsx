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
  return (
    <>
      <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
    </>
  )
}
