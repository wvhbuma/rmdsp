/*
 * Feature Visibility: per nav-groep een master-toggle + per pagina een toggle.
 * Uit = de pagina verdwijnt uit de Sidebar (zie filterNavGroups). Settings zelf
 * is bewust niet toggelbaar, zodat deze pagina altijd bereikbaar blijft.
 */
import { NAV_GROUPS, groupLeafPaths, type NavLeaf } from '@/layout/navigation'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { ToggleSwitch } from '@/components/settings/ToggleSwitch'

// Settings-groep niet tonen: die mag niet verborgen kunnen worden.
const TOGGLEABLE_GROUPS = NAV_GROUPS.filter((g) => g.key !== 'settings')

export function FeatureVisibilitySection() {
  const { isFeatureEnabled, setFeatureEnabled, setFeaturesEnabled } =
    useUserPreferences()

  return (
    <div className="space-y-5">
      {TOGGLEABLE_GROUPS.map((group) => {
        const paths = groupLeafPaths(group)
        const allOn = paths.every(isFeatureEnabled)
        return (
          <div
            key={group.key}
            className="rounded-lg border border-rm-border bg-rm-surface"
          >
            <div className="flex items-center justify-between gap-3 border-b border-rm-border px-4 py-2.5">
              <span className="font-display font-semibold text-sm text-rm-dark">
                {group.label}
              </span>
              <ToggleSwitch
                checked={allOn}
                onChange={(next) => setFeaturesEnabled(paths, next)}
                label={`${group.label} — alles`}
              />
            </div>
            <div className="px-4 py-1">
              {group.children?.map((leaf) => (
                <PageRow
                  key={leaf.path}
                  leaf={leaf}
                  checked={isFeatureEnabled(leaf.path)}
                  onChange={(next) => setFeatureEnabled(leaf.path, next)}
                />
              ))}
              {group.subgroups?.map((sub) => (
                <div key={sub.key}>
                  <div className="px-1 pb-0.5 pt-2 font-display text-[10px] uppercase tracking-wide text-rm-gray">
                    {sub.label}
                  </div>
                  {sub.items.map((leaf) => (
                    <PageRow
                      key={leaf.path}
                      leaf={leaf}
                      checked={isFeatureEnabled(leaf.path)}
                      onChange={(next) => setFeatureEnabled(leaf.path, next)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PageRow({
  leaf,
  checked,
  onChange,
}: {
  leaf: NavLeaf
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="font-body text-[13px] text-rm-dark">{leaf.label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} label={leaf.label} />
    </div>
  )
}
