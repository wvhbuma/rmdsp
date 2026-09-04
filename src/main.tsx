import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from '@/App'
import { ConfigError } from '@/pages/ConfigError'
import { getMsalInstance } from '@/config/msal'
import { missingEntraVars } from '@/config/env'
import '@/styles/globals.css'

/*
 * Eén QueryClient voor de hele app (server-state cache, Fase 1-foundation).
 * Buiten de component-tree zodat StrictMode's dubbele mount geen tweede client
 * aanmaakt.
 */
const queryClient = new QueryClient()

/*
 * Bootstrap de React-app.
 *
 * MSAL v5+ vereist expliciete `await initialize()` voordat PublicClientApplication
 * gebruikt kan worden. We doen dat hier, buiten de React-tree, zodat StrictMode's
 * dubbele mount in dev niet tot dubbele init leidt (getMsalInstance is singleton).
 *
 * Als Entra-env-vars missen: toon ConfigError-pagina i.p.v. crashen — dan kan
 * een developer tenminste zien wat er mist.
 */
async function bootstrap(root: Root): Promise<void> {
  // Dev-only: VITE_DEV_NO_AUTH=true slaat Entra-config-checks + login over en
  // gebruikt een stub MSAL-instance (geen netwerk). NOOIT in productie/CI.
  const devNoAuth = import.meta.env.VITE_DEV_NO_AUTH === 'true'

  if (!devNoAuth) {
    const missing = missingEntraVars()
    if (missing.length > 0) {
      root.render(<ConfigError missing={missing} />)
      return
    }
  }

  const instance = await getMsalInstance(devNoAuth)
  if (!instance) {
    root.render(<ConfigError missing={['MSAL instance kon niet initialiseren']} />)
    return
  }

  root.render(
    <StrictMode>
      <MsalProvider instance={instance}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </MsalProvider>
    </StrictMode>,
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('#root element ontbreekt in index.html')
const root = createRoot(container)

bootstrap(root).catch((err: unknown) => {
  console.error('Bootstrap failed', err)
  const message = err instanceof Error ? err.message : 'Onbekende fout'
  root.render(<ConfigError missing={[`Bootstrap fout: ${message}`]} />)
})
