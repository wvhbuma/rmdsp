/*
 * Route Assignment: toewijzing op route-niveau (Prague/Paris/Milan). Toegang tot
 * een route geeft automatisch toegang tot alle richtingen én verborgen MarketIDs
 * eronder (bidirectioneel). Bewaard in localStorage (ram_user_routes).
 * Default: alle routes toegewezen.
 *
 * De richtingen worden alleen ter info getoond (read-only); ze zijn niet apart
 * toggelbaar. Verborgen detour-MarketIDs verschijnen hier niet.
 */
import { ROUTE_CONFIG } from '@/config/routes'
import { stationShort } from '@/config/displacement'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { ToggleSwitch } from '@/components/settings/ToggleSwitch'

/** "PNO-BLS" → "PNO → BLS". */
function formatDirection(code: string): string {
  return code
    .split('-')
    .map((c) => stationShort(c))
    .join(' → ')
}

export function RouteAssignmentSection() {
  const { isRouteEnabled, setRouteEnabled } = useUserPreferences()

  return (
    <div className="space-y-3">
      {Object.entries(ROUTE_CONFIG).map(([route, entry]) => {
        const on = isRouteEnabled(route)
        return (
          <div
            key={route}
            className="flex items-start justify-between gap-3 rounded-lg border border-rm-border bg-rm-surface px-4 py-3"
          >
            <div>
              <span className="font-display font-semibold text-sm text-rm-dark">
                {route}
              </span>
              <div className="mt-0.5 font-body text-xs text-rm-gray">
                {entry.directions.map(formatDirection).join(' · ')}
                {entry.hidden.length > 0 && (
                  <span className="text-rm-gray">
                    {' '}
                    · incl. omleiding ({entry.hidden.map(formatDirection).join(', ')})
                  </span>
                )}
              </div>
            </div>
            <ToggleSwitch
              checked={on}
              onChange={(next) => setRouteEnabled(route, next)}
              label={route}
            />
          </div>
        )
      })}
    </div>
  )
}
