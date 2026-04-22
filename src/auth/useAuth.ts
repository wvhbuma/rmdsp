import { useMsal } from '@azure/msal-react'
import { LOGIN_REQUEST } from '@/config/msal'

/*
 * Wrapper rond useMsal() — geeft een vlakke API terug zonder dat components
 * de MSAL-primitives hoeven te kennen. Gebruikt voor Topbar (email) + logout.
 */
export function useAuth() {
  const { accounts, instance } = useMsal()
  const account = accounts[0] ?? null

  return {
    /** Email-claim uit ID-token, of null als er geen sessie is. */
    email: account?.username ?? null,
    /** Display-name uit ID-token (kan leeg zijn afhankelijk van IdP). */
    name: account?.name ?? null,
    /** Start login-redirect naar Entra. */
    signIn: () => instance.loginRedirect(LOGIN_REQUEST),
    /** Start logout-redirect; Entra clearedt de sessie en redirectet terug. */
    signOut: () =>
      instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
      }),
  }
}
