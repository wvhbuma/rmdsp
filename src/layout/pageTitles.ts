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
  '/distribution-channels': 'Distribution & Channels',
  '/overbooking': 'Overbooking',
  '/ancillary': 'Ancillary Management',
  '/budget-targets': 'Budget & Targets',
  '/audit': 'Audit Trail',
  '/decision-log': 'Decision Log',
  '/approval-rules': 'Approval Rules',
}

export function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Not Found'
}
