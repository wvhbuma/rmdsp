/*
 * Monthly Details — O&D-niveau analyse.
 *
 * Scatter (units × avgFare, villain ▼ / victim ▲, punt-grootte ~ volume,
 * mediaan-lijn, labels op top-12) + maandtabel + O&D-cards.
 */
import { useMemo, useState } from 'react'
import type {
  DisplacementOD,
  DisplacementResponse,
} from '@/types/displacement'
import { useDisplacement } from '@/hooks/useDisplacement'
import {
  defaultFilter,
  effectiveMonths,
  filterOd,
  filterSummary,
  odCategory,
  type DisplacementFilter,
} from '@/utils/displacement'
import { cabinLabel, COLORS } from '@/config/displacement'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { paletteColors, pickColor } from '@/config/userPreferences'
import { formatCurrency, formatNumber } from '@/utils/format'
import { FilterBar } from '@/components/displacement/FilterBar'
import { MonthTable } from '@/components/displacement/MonthTable'
import { EChart } from '@/components/displacement/EChart'
import { SectionCard } from '@/components/displacement/SectionCard'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/displacement/StateViews'
import type { EChartsCoreOption } from 'echarts/core'

export function DisplacementMonthly() {
  const query = useDisplacement()

  if (query.isPending) return <LoadingState />
  if (query.isError) return <ErrorState message={query.error.message} />
  if (query.data.summary.length === 0) return <EmptyState />

  return <MonthlyView data={query.data} />
}

function MonthlyView({ data }: { data: DisplacementResponse }) {
  const [filter, setFilter] = useState<DisplacementFilter>(() =>
    defaultFilter(data, 'multi'),
  )

  const months = useMemo(() => effectiveMonths(data, filter), [data, filter])
  const summary = useMemo(
    () => filterSummary(data, filter, months),
    [data, filter, months],
  )
  const od = useMemo(() => filterOd(data, filter, months), [data, filter, months])

  // Scatter-palet uit User Preferences (villain = kleur 0, victim = kleur 1).
  const { chartPrefs } = useUserPreferences()
  const scatterColors = paletteColors(chartPrefs.scatter)
  const scatterOption = useMemo(
    () => buildScatterOption(od, scatterColors),
    [od, scatterColors],
  )

  // O&D-cards: hoogste volume eerst.
  const odSorted = useMemo(
    () => [...od].sort((a, b) => b.units - a.units),
    [od],
  )

  return (
    <div>
      <FilterBar data={data} value={filter} onChange={setFilter} periodMode="multi" />

      <div className="space-y-6 p-6">
        <SectionCard
          title="O&D displacement-scatter"
          subtitle="Units × gem. fare — ▼ villain (verdringt), ▲ victim (verdrongen)"
        >
          {od.length === 0 ? (
            <EmptyState />
          ) : (
            <EChart option={scatterOption} className="h-96" />
          )}
        </SectionCard>

        <SectionCard title="Maanddetail" subtitle="Met jaar-subtotalen">
          <MonthTable rows={summary} monthOrder={data.months} />
        </SectionCard>

        <SectionCard title="O&D's" subtitle={`${odSorted.length} origin–destination paren`}>
          {odSorted.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {odSorted.map((o, i) => (
                <OdCard key={`${o.od}-${o.cabin}-${i}`} od={o} stationNames={data.stationNames} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

/** "BEMI → PRA" → "Brussels → Prague" via stationNames (fallback: code). */
function formatOdLong(od: string, stationNames: Record<string, string>): string {
  return od
    .split('→')
    .map((c) => {
      const code = c.trim()
      return stationNames[code] ?? code
    })
    .join(' → ')
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

interface ScatterPoint {
  value: [number, number]
  name: string
  label?: { show: boolean }
}

function buildScatterOption(
  od: DisplacementOD[],
  palette: string[],
): EChartsCoreOption {
  const villainColor = pickColor(palette, 0)
  const victimColor = pickColor(palette, 1)
  // Top-12 op volume krijgt een label.
  const topUnits = new Set(
    [...od].sort((a, b) => b.units - a.units).slice(0, 12).map((o) => o.od + o.cabin),
  )

  function toPoint(o: DisplacementOD): ScatterPoint {
    const point: ScatterPoint = {
      value: [o.units, o.avgFare],
      name: o.od,
    }
    if (topUnits.has(o.od + o.cabin)) point.label = { show: true }
    return point
  }

  const villains = od.filter((o) => odCategory(o) === 'villain').map(toPoint)
  const victims = od.filter((o) => odCategory(o) === 'victim').map(toPoint)
  const medianFare = median(od.map((o) => o.avgFare))

  return {
    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: { data: ScatterPoint }) =>
        `${p.data.name}<br/>Units: ${formatNumber(p.data.value[0])}<br/>Gem. fare: ${formatCurrency(p.data.value[1])}`,
    },
    legend: { data: ['Villain', 'Victim'], top: 0, textStyle: { color: COLORS.gray } },
    xAxis: {
      type: 'value',
      name: 'Units',
      nameLocation: 'middle',
      nameGap: 28,
      axisLabel: { color: COLORS.gray },
    },
    yAxis: {
      type: 'value',
      name: 'Gem. fare (€)',
      axisLabel: { color: COLORS.gray, formatter: '{value}' },
    },
    series: [
      {
        name: 'Villain',
        type: 'scatter',
        data: villains,
        symbol: 'triangle',
        symbolRotate: 180,
        symbolSize: (d: number[]) => Math.max(8, Math.sqrt(d[0]) * 1.6),
        itemStyle: { color: villainColor, opacity: 0.8 },
        label: {
          position: 'top',
          fontSize: 10,
          color: COLORS.dark,
          formatter: (p: { data: ScatterPoint }) => p.data.name,
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: COLORS.gray, type: 'dashed' },
          label: {
            formatter: `mediaan ${formatCurrency(medianFare)}`,
            color: COLORS.gray,
            position: 'insideEndTop',
          },
          data: [{ yAxis: Math.round(medianFare) }],
        },
      },
      {
        name: 'Victim',
        type: 'scatter',
        data: victims,
        symbol: 'triangle',
        symbolSize: (d: number[]) => Math.max(8, Math.sqrt(d[0]) * 1.6),
        itemStyle: { color: victimColor, opacity: 0.8 },
        label: {
          position: 'top',
          fontSize: 10,
          color: COLORS.dark,
          formatter: (p: { data: ScatterPoint }) => p.data.name,
        },
      },
    ],
  }
}

function OdCard({
  od,
  stationNames,
}: {
  od: DisplacementOD
  stationNames: Record<string, string>
}) {
  const isVillain = odCategory(od) === 'villain'
  // Accent via theme-token-classes (villain = rood, victim = ES-blue).
  const accentBorder = isVillain ? 'border-l-villain' : 'border-l-es-blue'
  const accentBg = isVillain ? 'bg-villain' : 'bg-es-blue'
  return (
    <div
      className={`rounded-lg border border-rm-border border-l-4 bg-rm-surface p-3 ${accentBorder}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold text-[13px] text-rm-dark">
          {formatOdLong(od.od, stationNames)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${accentBg}`}
        >
          {isVillain ? 'Villain' : 'Victim'}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-4 font-body text-xs text-rm-gray">
        <span>{cabinLabel(od.cabin)}</span>
        <span>Zone {od.zone}</span>
        <span>{formatNumber(od.units)} units</span>
        <span className="text-rm-dark">{formatCurrency(od.avgFare)}</span>
      </div>
    </div>
  )
}
