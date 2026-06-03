/*
 * SeasonOverview — KPI-dashboard over de berekende targets.
 *
 * KPI-cards (vertrekken, units, LF, yield, revenue, RAU, vs-PY-index) +
 * drie tabellen (per cabin / per maand / per route×cabin) + twee ECharts
 * (revenue-bar per cabin, units-donut per cabin). Volgt het option-builder- en
 * KpiCard-patroon van DisplacementReporting.
 */
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import type { SeasonalTarget } from '@/types/seasonal'
import { useSeasonalResults } from '@/hooks/useSeasonal'
import { CABIN_COLORS, CABIN_LABELS, CABIN_ORDER } from '@/config/seasonal'
import { COLORS } from '@/config/displacement'
import {
  formatCurrency,
  formatCurrencyCompact,
  formatLf,
  formatNumber,
} from '@/utils/format'
import { KpiCard } from '@/components/displacement/KpiCard'
import { SectionCard } from '@/components/displacement/SectionCard'
import { EChart } from '@/components/displacement/EChart'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/displacement/StateViews'

export function SeasonOverview() {
  const query = useSeasonalResults()

  if (query.isPending) return <LoadingState label="Resultaten laden…" />
  if (query.isError) return <ErrorState message={query.error.message} />
  if (query.data.targets.length === 0) {
    return (
      <EmptyState message="Nog geen targets. Maak eerst een seizoen aan via New Season." />
    )
  }

  return <OverviewView targets={query.data.targets} />
}

/* ── Aggregatie ─────────────────────────────────────────────────────────── */

interface Agg {
  units: number
  revenue: number
  capacity: number
  pyRevenue: number
}

function emptyAgg(): Agg {
  return { units: 0, revenue: 0, capacity: 0, pyRevenue: 0 }
}

function addTarget(agg: Agg, t: SeasonalTarget): void {
  agg.units += t.targetUnits
  agg.revenue += t.targetRevenue
  agg.capacity += t.capacity
  agg.pyRevenue += t.pyRevenue
}

const lf = (a: Agg) => (a.capacity > 0 ? a.units / a.capacity : 0)
const yld = (a: Agg) => (a.units > 0 ? a.revenue / a.units : 0)
const rau = (a: Agg) => (a.capacity > 0 ? a.revenue / a.capacity : 0)
const pyIndex = (a: Agg) => (a.pyRevenue > 0 ? (a.revenue / a.pyRevenue) * 100 : 0)

function groupBy(
  targets: SeasonalTarget[],
  keyFn: (t: SeasonalTarget) => string,
): Map<string, Agg> {
  const map = new Map<string, Agg>()
  for (const t of targets) {
    const key = keyFn(t)
    const agg = map.get(key) ?? emptyAgg()
    addTarget(agg, t)
    map.set(key, agg)
  }
  return map
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7) // YYYY-MM
}

function monthLabel(key: string): string {
  const d = new Date(`${key}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return key
  return new Intl.DateTimeFormat('nl-NL', { month: 'short', year: 'numeric' }).format(d)
}

function OverviewView({ targets }: { targets: SeasonalTarget[] }) {
  const total = useMemo(() => {
    const agg = emptyAgg()
    for (const t of targets) addTarget(agg, t)
    return agg
  }, [targets])

  const departures = useMemo(
    () => new Set(targets.map((t) => `${t.market}|${t.departureDate}`)).size,
    [targets],
  )

  // Per cabin (in CABIN_ORDER), per maand (chronologisch), per route×cabin.
  const byCabin = useMemo(() => groupBy(targets, (t) => t.modelCabin), [targets])
  const presentCabins = useMemo(
    () => CABIN_ORDER.filter((c) => byCabin.has(c)),
    [byCabin],
  )
  const byMonth = useMemo(() => groupBy(targets, (t) => monthKey(t.departureDate)), [targets])
  const monthKeys = useMemo(() => [...byMonth.keys()].sort(), [byMonth])
  const byRouteCabin = useMemo(
    () => groupBy(targets, (t) => `${t.market}__${t.modelCabin}`),
    [targets],
  )
  const routeCabinKeys = useMemo(
    () => [...byRouteCabin.keys()].sort(),
    [byRouteCabin],
  )

  const revenueOption = useMemo(
    () => buildRevenueBar(presentCabins, byCabin),
    [presentCabins, byCabin],
  )
  const unitsOption = useMemo(
    () => buildUnitsDonut(presentCabins, byCabin),
    [presentCabins, byCabin],
  )

  return (
    <div className="space-y-6 p-6">
      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <KpiCard label="Vertrekken" value={formatNumber(departures)} />
        <KpiCard label="Target units" value={formatNumber(total.units)} />
        <KpiCard label="Load factor" value={formatLf(lf(total))} />
        <KpiCard label="Yield" value={formatCurrency(yld(total))} />
        <KpiCard label="Revenue" value={formatCurrencyCompact(total.revenue)} accent="blue" />
        <KpiCard label="RAU" value={formatCurrency(rau(total))} />
        <KpiCard
          label="vs PY revenue"
          value={total.pyRevenue > 0 ? `${Math.round(pyIndex(total))}` : '—'}
          sub="index (PY = 100)"
          accent="magenta"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Revenue per cabin" className="lg:col-span-2">
          <EChart option={revenueOption} className="h-72" />
        </SectionCard>
        <SectionCard title="Units per cabin" subtitle="Aandeel van de target-units">
          <EChart option={unitsOption} className="h-72" />
        </SectionCard>
      </div>

      {/* Per cabin */}
      <SectionCard title="Per cabin">
        <Table head={['Cabin', 'Units', 'LF', 'Yield', 'Revenue', 'RAU', 'vs PY']}>
          {presentCabins.map((c) => {
            const a = byCabin.get(c)!
            return (
              <Row
                key={c}
                cells={[
                  CABIN_LABELS[c] ?? c,
                  formatNumber(a.units),
                  formatLf(lf(a)),
                  formatCurrency(yld(a)),
                  formatCurrency(a.revenue),
                  formatCurrency(rau(a)),
                  a.pyRevenue > 0 ? String(Math.round(pyIndex(a))) : '—',
                ]}
              />
            )
          })}
        </Table>
      </SectionCard>

      {/* Per maand */}
      <SectionCard title="Per maand">
        <Table head={['Maand', 'Units', 'LF', 'Yield', 'Revenue']}>
          {monthKeys.map((m) => {
            const a = byMonth.get(m)!
            return (
              <Row
                key={m}
                cells={[
                  monthLabel(m),
                  formatNumber(a.units),
                  formatLf(lf(a)),
                  formatCurrency(yld(a)),
                  formatCurrency(a.revenue),
                ]}
              />
            )
          })}
        </Table>
      </SectionCard>

      {/* Per route × cabin */}
      <SectionCard title="Per route × cabin">
        <Table head={['Route', 'Cabin', 'Units', 'LF', 'Yield', 'Revenue']}>
          {routeCabinKeys.map((key) => {
            const a = byRouteCabin.get(key)!
            const [market, cabin] = key.split('__')
            return (
              <Row
                key={key}
                cells={[
                  market,
                  CABIN_LABELS[cabin] ?? cabin,
                  formatNumber(a.units),
                  formatLf(lf(a)),
                  formatCurrency(yld(a)),
                  formatCurrency(a.revenue),
                ]}
              />
            )
          })}
        </Table>
      </SectionCard>
    </div>
  )
}

/* ── Tabellen ───────────────────────────────────────────────────────────── */

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rm-border">
      <table className="w-full border-collapse text-right font-body text-[13px]">
        <thead>
          <tr className="bg-rm-gray-light text-rm-dark">
            {head.map((h, i) => (
              <th
                key={h}
                className={`px-3 py-2 font-display font-semibold ${i === 0 ? 'text-left' : ''}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Row({ cells }: { cells: string[] }) {
  return (
    <tr className="border-t border-rm-border hover:bg-rm-gray-light/50">
      {cells.map((c, i) => (
        <td
          key={i}
          className={`px-3 py-1.5 ${i === 0 ? 'text-left font-medium text-rm-dark' : 'text-rm-gray'}`}
        >
          {c}
        </td>
      ))}
    </tr>
  )
}

/* ── Chart-builders ─────────────────────────────────────────────────────── */

function buildRevenueBar(
  cabins: readonly string[],
  byCabin: Map<string, Agg>,
): EChartsCoreOption {
  return {
    grid: { left: 8, right: 8, top: 24, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: cabins.map((c) => CABIN_LABELS[c] ?? c),
      axisLabel: { color: COLORS.gray },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: COLORS.gray, formatter: (v: number) => formatCurrencyCompact(v) },
    },
    series: [
      {
        type: 'bar',
        barWidth: '50%',
        data: cabins.map((c) => ({
          value: Math.round(byCabin.get(c)?.revenue ?? 0),
          itemStyle: { color: CABIN_COLORS[c] ?? COLORS.gray, borderRadius: [3, 3, 0, 0] },
        })),
      },
    ],
  }
}

function buildUnitsDonut(
  cabins: readonly string[],
  byCabin: Map<string, Agg>,
): EChartsCoreOption {
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}<br/>${formatNumber(p.value)} units (${p.percent}%)`,
    },
    legend: { bottom: 0, textStyle: { color: COLORS.gray } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: cabins.map((c) => ({
          name: CABIN_LABELS[c] ?? c,
          value: Math.round(byCabin.get(c)?.units ?? 0),
          itemStyle: { color: CABIN_COLORS[c] ?? COLORS.gray },
        })),
      },
    ],
  }
}
