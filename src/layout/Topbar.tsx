import { useLocation } from 'react-router-dom'
import { getPageTitle } from '@/layout/pageTitles'

export function Topbar() {
  const { pathname } = useLocation()
  const title = getPageTitle(pathname)

  return (
    <header className="bg-rm-surface border-b border-rm-border px-8 py-4 flex items-center justify-between">
      <h1 className="font-display font-semibold text-[20px] text-rm-dark">
        {title}
      </h1>
      {/* Rechts-zijde: datum + user-info komen in stap 4/5 */}
      <div className="text-xs text-rm-gray" />
    </header>
  )
}
