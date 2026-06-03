/*
 * Route Assignment: kies welke routes (en richtingen) beschikbaar zijn in de
 * filter-dropdowns op alle pagina's. Bewaard in localStorage (ram_user_routes).
 * Default: alle routes uit de catalogus toegewezen.
 *
 * Een markt aan/uit zetten cascadeert naar zijn richtingen, zodat de twee niet
 * uit sync raken.
 */
import { ROUTE_CATALOG } from '@/config/routes'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { ToggleSwitch } from '@/components/settings/ToggleSwitch'

export function RouteAssignmentSection() {
  const {
    isMarketEnabled,
    isDirectionEnabled,
    setMarketEnabled,
    setDirectionEnabled,
  } = useUserPreferences()

  return (
    <div className="space-y-3">
      {ROUTE_CATALOG.map((entry) => {
        const marketOn = isMarketEnabled(entry.market)
        return (
          <div
            key={entry.market}
            className="rounded-lg border border-rm-border bg-rm-surface"
          >
            <div className="flex items-center justify-between gap-3 border-b border-rm-border px-4 py-2.5">
              <span className="font-display font-semibold text-sm text-rm-dark">
                {entry.market}
              </span>
              <ToggleSwitch
                checked={marketOn}
                onChange={(next) => {
                  setMarketEnabled(entry.market, next)
                  // Cascade: richtingen volgen de markt.
                  for (const d of entry.directions) {
                    setDirectionEnabled(d.code, next)
                  }
                }}
                label={entry.market}
              />
            </div>
            <div className="px-4 py-1">
              {entry.directions.map((dir) => (
                <div
                  key={dir.code}
                  className="flex items-center justify-between gap-3 py-1.5"
                >
                  <span className="font-body text-[13px] text-rm-dark">
                    {dir.label}
                  </span>
                  <ToggleSwitch
                    checked={isDirectionEnabled(dir.code)}
                    disabled={!marketOn}
                    onChange={(next) => {
                      setDirectionEnabled(dir.code, next)
                      // Een richting aanzetten impliceert dat de markt aan staat.
                      if (next && !marketOn) setMarketEnabled(entry.market, true)
                    }}
                    label={dir.label}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
