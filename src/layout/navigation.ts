/*
 * Navigatie-data — authoritatieve bron voor Sidebar én pageTitles.
 * Wijzigingen aan de nav-structuur horen HIER; Sidebar.tsx map()'t hier overheen.
 * Zie docs/NAV_STRUCTURE.md voor de volledige route-tabel.
 */
import type { IconName } from '@/layout/icons'

export interface NavLeaf {
  label: string
  path: string
  icon: IconName
  /*
   * Exacte match afdwingen voor NavLink. Nodig wanneer dit pad een prefix is van
   * zustergroep-paden (bv. /displacement vs /displacement/monthly), anders blijft
   * de leaf actief op kind-routes.
   */
  end?: boolean
}

export interface NavSubgroup {
  key: string
  label: string
  icon: IconName
  items: NavLeaf[]
}

export interface NavGroup {
  key: string
  label: string
  icon: IconName
  children?: NavLeaf[]
  subgroups?: NavSubgroup[]
}

export type NavEntry = NavLeaf | NavGroup

export const HOME_ITEM: NavLeaf = {
  label: 'Home',
  path: '/',
  icon: 'home',
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'flight-optimization',
    label: 'Flight Optimization',
    icon: 'activity',
    children: [
      { label: 'Findings', path: '/findings', icon: 'alert-triangle' },
      { label: 'Overview', path: '/flight-overview', icon: 'target' },
      { label: 'Cockpit', path: '/cockpit', icon: 'clock' },
      { label: 'Network View', path: '/network-view', icon: 'network' },
      { label: 'Fare Recommender', path: '/fare-recommender', icon: 'layers' },
    ],
  },
  {
    key: 'business-overview',
    label: 'Business Overview',
    icon: 'bar-chart',
    subgroups: [
      {
        key: 'bo-performance',
        label: 'Performance',
        icon: 'trending-up',
        items: [
          { label: 'Weekly Performance', path: '/weekly', icon: 'calendar' },
          { label: 'Monthly Performance', path: '/monthly', icon: 'grid' },
          { label: 'Decision Support', path: '/decision-support', icon: 'activity' },
          { label: 'Performance Analysis', path: '/performance-analysis', icon: 'search' },
        ],
      },
      {
        key: 'bo-customer',
        label: 'Customer',
        icon: 'users',
        items: [
          { label: 'Customer Analytics', path: '/customer-analytics', icon: 'user-search' },
        ],
      },
      {
        key: 'bo-operations',
        label: 'Operations',
        icon: 'sun',
        items: [
          { label: 'Operational Impact', path: '/operational-impact', icon: 'alert-triangle' },
          { label: 'Margin Management', path: '/margin-management', icon: 'dollar' },
        ],
      },
      {
        key: 'bo-market',
        label: 'Market',
        icon: 'eye',
        items: [
          { label: 'Competitor Intel', path: '/competitor-intel', icon: 'eye' },
        ],
      },
      {
        key: 'bo-multileg',
        label: 'Multi-Leg',
        icon: 'git-merge',
        items: [
          { label: 'Displacement Reporting', path: '/displacement', icon: 'pie-chart', end: true },
          { label: 'Monthly Details', path: '/displacement/monthly', icon: 'crosshair' },
          { label: 'Departure Details', path: '/displacement/departures', icon: 'thermometer' },
        ],
      },
    ],
  },
  {
    key: 'business-management',
    label: 'Business Management',
    icon: 'layout',
    children: [
      { label: 'Distribution & Channels', path: '/distribution-channels', icon: 'share' },
      { label: 'Overbooking', path: '/overbooking', icon: 'users' },
      { label: 'Ancillary Management', path: '/ancillary', icon: 'package' },
      { label: 'Budget & Targets', path: '/budget-targets', icon: 'target' },
    ],
    subgroups: [
      {
        key: 'bm-season',
        label: 'Season Planning',
        icon: 'calendar',
        items: [
          { label: 'New Season', path: '/season/new', icon: 'target' },
          { label: 'Season Overview', path: '/season/overview', icon: 'bar-chart' },
          { label: 'Targets', path: '/season/targets', icon: 'target' },
          { label: 'Masks', path: '/season/masks', icon: 'layers' },
          { label: 'Simulation', path: '/season/simulation', icon: 'activity' },
          { label: 'Implementation', path: '/season/implement', icon: 'check-square' },
          { label: 'Settings', path: '/season/settings', icon: 'sliders' },
        ],
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'settings',
    children: [
      { label: 'Audit Trail', path: '/audit', icon: 'file-text' },
      { label: 'Decision Log', path: '/decision-log', icon: 'check-square' },
      { label: 'Approval Rules', path: '/approval-rules', icon: 'check' },
      { label: 'User Preferences', path: '/settings/preferences', icon: 'sliders' },
      { label: 'API Configuration', path: '/settings/api-configuration', icon: 'network' },
    ],
  },
]

/*
 * Reverse lookup: gegeven een URL-pad, vind de ouder-group-key en (indien van
 * toepassing) subgroup-key. Gebruikt door Sidebar.tsx om bij directe URL-load
 * automatisch de juiste groepen open te klappen.
 */
export interface PathLocation {
  groupKey?: string
  subgroupKey?: string
}

export function findPathLocation(pathname: string): PathLocation {
  for (const group of NAV_GROUPS) {
    if (group.children?.some((c) => c.path === pathname)) {
      return { groupKey: group.key }
    }
    if (group.subgroups) {
      for (const sub of group.subgroups) {
        if (sub.items.some((i) => i.path === pathname)) {
          return { groupKey: group.key, subgroupKey: sub.key }
        }
      }
    }
  }
  return {}
}

/** Alle leaf-paden binnen een group (children + alle subgroup-items). */
export function groupLeafPaths(group: NavGroup): string[] {
  return [
    ...(group.children?.map((c) => c.path) ?? []),
    ...(group.subgroups?.flatMap((s) => s.items.map((i) => i.path)) ?? []),
  ]
}

/*
 * Filter de nav-structuur op zichtbaarheid (Feature Visibility uit User
 * Preferences). Lege subgroups en lege groups vallen weg, zodat de Sidebar geen
 * lege koppen toont. Pure functie — geen state.
 */
export function filterNavGroups(
  groups: NavGroup[],
  isVisible: (path: string) => boolean,
): NavGroup[] {
  const result: NavGroup[] = []
  for (const group of groups) {
    const children = group.children?.filter((c) => isVisible(c.path))
    const subgroups = group.subgroups
      ?.map((s) => ({ ...s, items: s.items.filter((i) => isVisible(i.path)) }))
      .filter((s) => s.items.length > 0)

    const hasChildren = (children?.length ?? 0) > 0
    const hasSubgroups = (subgroups?.length ?? 0) > 0
    if (!hasChildren && !hasSubgroups) continue

    result.push({
      ...group,
      children: hasChildren ? children : undefined,
      subgroups: hasSubgroups ? subgroups : undefined,
    })
  }
  return result
}
