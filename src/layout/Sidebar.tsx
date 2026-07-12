import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  HOME_ITEM,
  NAV_GROUPS,
  filterNavGroups,
  findPathLocation,
  type NavLeaf,
  type NavSubgroup,
} from '@/layout/navigation'
import { Icon } from '@/layout/icons'
import { useUserPreferences } from '@/hooks/useUserPreferences'

/*
 * Klassen voor een nav-leaf. React Router v7's NavLink kan óf een className-
 * string óf een functie accepteren; de functie krijgt een `isActive`-flag
 * zodat we de actieve styling conditioneel kunnen toepassen.
 */
function leafClass({ isActive }: { isActive: boolean }): string {
  const base =
    'flex items-center gap-2.5 px-5 py-2.5 w-full text-left font-display font-medium text-[13px] border-r-[3px] transition-colors'
  return isActive
    ? `${base} text-es-blue bg-[rgba(0,119,255,0.06)] border-r-es-blue`
    : `${base} text-rm-gray border-r-transparent hover:bg-rm-gray-light hover:text-rm-dark`
}

/*
 * Sub-item binnen een subgroup (Business Overview leafs): iets meer inspringing
 * zodat de hiërarchie visueel leesbaar is.
 */
function subItemClass({ isActive }: { isActive: boolean }): string {
  const base =
    'flex items-center gap-2.5 pl-11 pr-5 py-2 w-full text-left font-display font-medium text-xs border-r-[3px] transition-colors'
  return isActive
    ? `${base} text-es-blue bg-[rgba(0,119,255,0.06)] border-r-es-blue`
    : `${base} text-rm-gray border-r-transparent hover:bg-rm-gray-light hover:text-rm-dark`
}

export function Sidebar() {
  const { pathname } = useLocation()
  const { isFeatureEnabled } = useUserPreferences()
  // Verberg uitgeschakelde features (User Preferences → Feature Visibility).
  const groups = filterNavGroups(NAV_GROUPS, isFeatureEnabled)
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    const { groupKey, subgroupKey } = findPathLocation(pathname)
    const initial = new Set<string>()
    if (groupKey) initial.add(groupKey)
    if (subgroupKey) initial.add(subgroupKey)
    return initial
  })

  /*
   * Als de route wijzigt via URL-navigatie (back/forward of directe link),
   * zorg dat de nieuwe ouder-groepen open zijn. We voegen alleen toe — de
   * gebruiker mag groepen die hij zelf opent handmatig laten openstaan.
   */
  useEffect(() => {
    const { groupKey, subgroupKey } = findPathLocation(pathname)
    if (!groupKey && !subgroupKey) return
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (groupKey) next.add(groupKey)
      if (subgroupKey) next.add(subgroupKey)
      return next
    })
  }, [pathname])

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <aside className="w-sidebar shrink-0 bg-rm-surface border-r border-rm-border flex flex-col">
      {/* Logo-header */}
      <div className="px-5 pt-5 pb-4 border-b border-rm-border">
        <h2 className="font-display font-bold text-base bg-gradient-to-br from-es-blue to-es-magenta bg-clip-text text-transparent">
          European Sleeper
        </h2>
        <div className="text-[11px] text-rm-gray mt-0.5">RevenueMindz</div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Home (top-level, geen group) */}
        <NavLink to={HOME_ITEM.path} end className={leafClass}>
          <Icon name={HOME_ITEM.icon} className="w-[18px] h-[18px] shrink-0" />
          <span>{HOME_ITEM.label}</span>
        </NavLink>

        {groups.map((group) => {
          const isOpen = openKeys.has(group.key)
          return (
            <div key={group.key} className="mt-1">
              <GroupHeader
                label={group.label}
                icon={group.icon}
                isOpen={isOpen}
                onClick={() => toggle(group.key)}
              />
              {isOpen && (
                <div className="pb-1">
                  {group.children?.map((leaf) => (
                    <LeafLink key={leaf.path} leaf={leaf} indent="child" />
                  ))}
                  {group.subgroups?.map((sub) => (
                    <SubgroupBlock
                      key={sub.key}
                      sub={sub}
                      isOpen={openKeys.has(sub.key)}
                      onToggle={() => toggle(sub.key)}
                      asChild={Boolean(group.children?.length)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer met versie + build-datum (DSP regel 2249 equivalent) */}
      <div className="px-5 py-3 border-t border-rm-border text-[10px] text-rm-gray font-body">
        v{__APP_VERSION__} · {__BUILD_DATE__}
      </div>
    </aside>
  )
}

function GroupHeader({
  label,
  icon,
  isOpen,
  onClick,
}: {
  label: string
  icon: Parameters<typeof Icon>[0]['name']
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 px-5 py-2.5 w-full text-left font-display font-medium text-[13px] text-rm-gray hover:bg-rm-gray-light hover:text-rm-dark transition-colors"
    >
      <Icon name={icon} className="w-[18px] h-[18px] shrink-0" />
      <span className="flex-1">{label}</span>
      <Icon
        name="chevron-down"
        className={`w-[14px] h-[14px] shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`}
      />
    </button>
  )
}

function LeafLink({
  leaf,
  indent,
}: {
  leaf: NavLeaf
  indent: 'child' | 'sub'
}) {
  const className = indent === 'sub' ? subItemClass : leafClass
  return (
    <NavLink to={leaf.path} end={leaf.end} className={className}>
      <Icon name={leaf.icon} className="w-[16px] h-[16px] shrink-0" />
      <span>{leaf.label}</span>
    </NavLink>
  )
}

function SubgroupBlock({
  sub,
  isOpen,
  onToggle,
  asChild = false,
}: {
  sub: NavSubgroup
  isOpen: boolean
  onToggle: () => void
  /*
   * `asChild`: deze subgroup staat tussen directe children van de groep (bv.
   * Season Planning naast Budget & Targets onder Business Management). De header
   * krijgt dan exact de child-leaf styling (px-5, text-[13px], 16px icon) zodat
   * hij op hetzelfde niveau staat. Zonder children (bv. Multi-Leg onder Business
   * Overview) houdt de header de ingesprongen subgroup-styling.
   */
  asChild?: boolean
}) {
  const headerClass = asChild
    ? 'flex items-center gap-2.5 px-5 py-2.5 w-full text-left font-display font-medium text-[13px] text-rm-gray hover:bg-rm-gray-light hover:text-rm-dark transition-colors'
    : 'flex items-center gap-2.5 pl-8 pr-5 py-2 w-full text-left font-display font-medium text-xs text-rm-gray hover:bg-rm-gray-light hover:text-rm-dark transition-colors'
  const iconClass = asChild ? 'w-[16px] h-[16px] shrink-0' : 'w-[14px] h-[14px] shrink-0'
  const chevronClass = asChild ? 'w-[14px] h-[14px] shrink-0' : 'w-[12px] h-[12px] shrink-0'
  return (
    <div>
      <button type="button" onClick={onToggle} className={headerClass}>
        <Icon name={sub.icon} className={iconClass} />
        <span className="flex-1">{sub.label}</span>
        <Icon
          name="chevron-down"
          className={`${chevronClass} transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {isOpen && (
        <div>
          {sub.items.map((leaf) => (
            <LeafLink key={leaf.path} leaf={leaf} indent="sub" />
          ))}
        </div>
      )}
    </div>
  )
}
