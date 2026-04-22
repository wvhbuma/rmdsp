import { useLocation } from 'react-router-dom'
import { getPageTitle } from '@/layout/pageTitles'

/*
 * De NL-geformatteerde datum recht-boven wordt op elke render opnieuw berekend.
 * De Topbar mount één keer per app-sessie (buiten <Outlet />), dus in de praktijk
 * betekent dit: datum = moment waarop de gebruiker de app opende. Dat is voor nu
 * prima; als we later live-ticking willen, moet het in een useState + setInterval.
 */
const DATE_FORMATTER = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function Topbar() {
  const { pathname } = useLocation()
  const title = getPageTitle(pathname)
  const today = DATE_FORMATTER.format(new Date())

  return (
    <header className="bg-rm-surface border-b border-rm-border px-8 py-4 flex items-center justify-between gap-4">
      <h1 className="font-display font-semibold text-[20px] text-rm-dark truncate">
        {title}
      </h1>
      <div className="flex items-center gap-5 shrink-0">
        <span className="font-body text-xs text-rm-gray">{today}</span>
        {/* User-email slot — wordt ingevuld in stap 5 (MSAL). */}
        <span
          data-testid="topbar-user-slot"
          className="font-body text-xs text-rm-gray"
        />
      </div>
    </header>
  )
}
