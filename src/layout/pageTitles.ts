/*
 * Pad → pagina-titel voor de Topbar.
 * Topbar-titels kunnen iets anders zijn dan sidebar-labels (bv. sidebar "Overview"
 * → topbar "Flight Optimization — Overview"), vandaar aparte map.
 */
export const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/flight-overview': 'Flight Optimization — Overview',
  '/cockpit': 'Cockpit',
  '/network-view': 'Network View',
  '/fare-recommender': 'Fare Recommender',
  '/weekly': 'Weekly Performance',
  '/monthly': 'Monthly Performance',
  '/decision-support': 'Decision Support',
  '/performance-analysis': 'Performance Analysis',
  '/customer-analytics': 'Customer Analytics',
  '/operational-impact': 'Operational Impact',
  '/margin-management': 'Margin Management',
  '/competitor-intel': 'Competitor Intel',
  '/displacement': 'Multi-Leg — Displacement Reporting',
  '/displacement/monthly': 'Multi-Leg — Monthly Details',
  '/displacement/departures': 'Multi-Leg — Departure Details',
  '/distribution-channels': 'Distribution & Channels',
  '/overbooking': 'Overbooking',
  '/ancillary': 'Ancillary Management',
  '/budget-targets': 'Budget & Targets',
  '/audit': 'Audit Trail',
  '/decision-log': 'Decision Log',
  '/approval-rules': 'Approval Rules',
  '/settings/preferences': 'User Preferences',
  '/settings/api-configuration': 'API Configuration',
  '/season/new': 'Season Planning — New Season',
  '/season/overview': 'Season Planning — Overview',
  '/season/targets': 'Season Planning — Targets',
  '/season/masks': 'Season Planning — Masks',
  '/season/simulation': 'Season Planning — Simulation',
  '/season/implement': 'Season Planning — Implementation',
  '/season/settings': 'Season Planning — Settings',
}

export function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Not Found'
}
