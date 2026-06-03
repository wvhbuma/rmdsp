/*
 * Chart Preferences: per chart-type een kleurenpalet kiezen uit 3 presets.
 * De keuze wordt bewaard in localStorage (ram_user_chart_prefs) en is
 * beschikbaar voor chart-componenten via useUserPreferences().chartPrefs.
 */
import {
  CHART_TYPES,
  PALETTES,
  PALETTE_IDS,
  type PaletteId,
} from '@/config/userPreferences'
import { useUserPreferences } from '@/hooks/useUserPreferences'

export function ChartPreferencesSection() {
  const { chartPrefs, setChartPalette } = useUserPreferences()

  return (
    <div className="overflow-hidden rounded-lg border border-rm-border bg-rm-surface">
      {CHART_TYPES.map((chart, idx) => (
        <div
          key={chart.id}
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
            idx > 0 ? 'border-t border-rm-border' : ''
          }`}
        >
          <span className="font-display font-medium text-[13px] text-rm-dark">
            {chart.label}
          </span>
          <div className="flex flex-wrap gap-2">
            {PALETTE_IDS.map((id) => (
              <PaletteOption
                key={id}
                paletteId={id}
                selected={chartPrefs[chart.id] === id}
                onSelect={() => setChartPalette(chart.id, id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PaletteOption({
  paletteId,
  selected,
  onSelect,
}: {
  paletteId: PaletteId
  selected: boolean
  onSelect: () => void
}) {
  const palette = PALETTES[paletteId]
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors ${
        selected
          ? 'border-es-blue bg-es-blue/5'
          : 'border-rm-border hover:bg-rm-gray-light'
      }`}
    >
      <span className="flex gap-0.5">
        {/* Swatch-kleuren komen uit de palette-config (arbitrair) → inline. */}
        {palette.colors.map((c) => (
          <span
            key={c}
            className="h-3.5 w-2 rounded-sm"
            style={{ backgroundColor: c }}
          />
        ))}
      </span>
      <span className="font-body text-xs text-rm-dark">{palette.label}</span>
    </button>
  )
}
