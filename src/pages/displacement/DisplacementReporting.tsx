/*
 * Displacement Reporting — landingspagina van de Multi-Leg Analysis.
 *
 * KPI-cards + trend (bars € / lijn %) + donut per cabin + maandtabel met
 * jaar-subtotalen. Filtert client-side via de gedeelde FilterBar (multi-month).
 */
import { useMemo, useState } from 'react'
import type {
  DisplacementResponse,
  DisplacementSummary,
} from '@/types/displacement'
import { useDisplacement } from '@/hooks/useDisplacement'
import {
  defaultFilter,
  effectiveMonths,
  filterDepartures,
  filterSummary,
  summarizeDepartures,
  sumBy,
  type DisplacementFilter,
} from '@/utils/displacement'
import { cabinLabel, sortCabins, COLORS } from '@/config/displacement'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { paletteColors, pickColor } from '@/config/userPreferences'
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPct,
} from '@/utils/format'
import { FilterBar } from '@/components/displacement/FilterBar'
import { KpiCard } from '@/components/displacement/KpiCard'
import { MonthTable } from '@/components/displacement/MonthTable'
import { EChart } from '@/components/displacement/EChart'
import { SectionCard } from '@/components/displacement/SectionCard'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/displacement/StateViews'
import type { EChartsCoreOption } from 'echarts/core'

export function DisplacementReporting() {
  const query = useDisplacement()

  if (query.isPending) return <LoadingState />
  if (query.isError) return <ErrorState message={query.error.message} />
  if (query.data.summary.length === 0) return <EmptyState />

  return <ReportingView data={query.data} />
}

function ReportingView({ data }: { data: DisplacementResponse }) {
  const [filter, setFilter] = useState<DisplacementFilter>(() =>
    defaultFilter(data, 'multi'),
  )

  const months = useMemo(() => effectiveMonths(data, filter), [data, filter])
  const departures = useMemo(
    () => filterDepartures(data, filter, months),
    [data, filter, months],
  )
  // Eén bron van waarheid: alle numerieke aggregaties (KPI's, piekmaand, trend,
  // tabel) komen uit de cabin-filterbare departures, gereconstrueerd naar
  // summary-vorm. Zo reageert de hele pagina op de cabin-selectie, net als de
  // donut (die al op departures draait).
  const cabinSummary = useMemo(
    () => summarizeDepartures(departures),
    [departures],
  )
  // filterSummary bepaalt hier alléén welke maanden in scope zijn (de as van
  // trend en tabel), nooit de getallen. Zo blijft de maand-as identiek aan de
  // vorige, summary-gebaseerde versie — inclusief lege maanden als 0-bar i.p.v.
  // dat ze verdwijnen (bv. Paris vóór maart 2026 heeft geen departures).
  const scopeSummary = useMemo(
    () => filterSummary(data, filter, months),
    [data, filter, months],
  )
  const summary = useMemo(
    () => padMonthsToScope(cabinSummary, scopeSummary),
    [cabinSummary, scopeSummary],
  )

  // KPI's.
  const totalRevenue = sumBy(summary, (r) => r.totalRevenue)
  const totalDisplacement = sumBy(summary, (r) => r.totalDisplacement)
  const displacementPct = totalRevenue > 0 ? (totalDisplacement / totalRevenue) * 100 : 0
  const constrained = sumBy(summary, (r) => r.bedConstrained + r.seatConstrained)
  const peak = peakMonth(summary)

  // Drempel-kleur voor displacement %: >3% rood, >1.5% magenta, anders neutraal.
  const pctAccent = displacementPct > 3 ? 'red' : displacementPct > 1.5 ? 'magenta' : 'neutral'

  // Chart-paletten uit User Preferences (per chart-type).
  const { chartPrefs } = useUserPreferences()
  const barColor = pickColor(paletteColors(chartPrefs.bar), 0)
  const lineColor = pickColor(paletteColors(chartPrefs.line), 1)
  const donutColors = paletteColors(chartPrefs.donut)

  const monthOrder = data.months
  const trendOption = useMemo(
    () => buildTrendOption(summary, monthOrder, barColor, lineColor),
    [summary, monthOrder, barColor, lineColor],
  )
  const donutOption = useMemo(
    () => buildDonutOption(departures, donutColors),
    [departures, donutColors],
  )

  return (
    <div>
      <FilterBar data={data} value={filter} onChange={setFilter} periodMode="multi" />

      <div className="space-y-6 p-6">
        {cabinSummary.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              <KpiCard
                label="Totale revenue"
                value={formatCurrencyCompact(totalRevenue)}
                sub={formatCurrency(totalRevenue)}
              />
              <KpiCard
                label="Displacement kosten"
                value={formatCurrencyCompact(totalDisplacement)}
                sub={formatCurrency(totalDisplacement)}
                accent="red"
              />
              <KpiCard
                label="Displacement %"
                value={formatPct(displacementPct)}
                sub="van totale revenue"
                accent={pctAccent}
              />
              <KpiCard
                label="Constrained vertrekken"
                value={formatNumber(constrained)}
                sub="bed + seat"
                accent="blue"
              />
              <KpiCard
                label="Piekmaand"
                value={peak ? peak.month : '–'}
                sub={peak ? formatCurrency(peak.value) : undefined}
                accent="red"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <SectionCard
                title="Displacement-trend"
                subtitle="€ per maand (bars) en % van revenue (lijn)"
                className="lg:col-span-2"
              >
                <EChart option={trendOption} className="h-72" />
              </SectionCard>
              <SectionCard title="Per cabin" subtitle="Aandeel displacement">
                <EChart option={donutOption} className="h-72" />
              </SectionCard>
            </div>

            <SectionCard title="Maanddetail" subtitle="Met jaar-subtotalen">
              <MonthTable rows={summary} monthOrder={monthOrder} />
            </SectionCard>
          </>
        )}
      </div>
    </div>
  )
}

/*
 * Zorgt dat elke maand die in scope is (scopeSummary) een rij houdt, ook als er
 * voor die maand geen departures zijn. Zo blijft de maand-as van trend en tabel
 * identiek aan de summary-gebaseerde versie: lege maanden tonen een 0-bar/0-rij
 * i.p.v. te verdwijnen. De padding-rijen zijn puur nul en veranderen dus geen
 * enkele som, piekmaand of percentage.
 */
function padMonthsToScope(
  rows: DisplacementSummary[],
  scopeSummary: DisplacementSummary[],
): DisplacementSummary[] {
  const present = new Set(rows.map((r) => r.month))
  const padded = [...rows]
  for (const s of scopeSummary) {
    if (present.has(s.month)) continue
    present.add(s.month)
    padded.push({
      market: s.market,
      route: s.route,
      month: s.month,
      bedRevenue: 0,
      bedDisplacement: 0,
      bedDisplacementPct: 0,
      bedDepartures: 0,
      bedConstrained: 0,
      seatRevenue: 0,
      seatDisplacement: 0,
      seatDepartures: 0,
      seatConstrained: 0,
      totalRevenue: 0,
      totalDisplacement: 0,
      totalDisplacementPct: 0,
    })
  }
  return padded
}

function peakMonth(
  rows: DisplacementSummary[],
): { month: string; value: number } | null {
  const byMonth = new Map<string, number>()
  for (const r of rows) {
    byMonth.set(r.month, (byMonth.get(r.month) ?? 0) + r.totalDisplacement)
  }
  let best: { month: string; value: number } | null = null
  for (const [month, value] of byMonth) {
    if (!best || value > best.value) best = { month, value }
  }
  return best
}

function buildTrendOption(
  rows: DisplacementSummary[],
  monthOrder: string[],
  barColor: string,
  lineColor: string,
): EChartsCoreOption {
  const dispByMonth = new Map<string, number>()
  const revByMonth = new Map<string, number>()
  for (const r of rows) {
    dispByMonth.set(r.month, (dispByMonth.get(r.month) ?? 0) + r.totalDisplacement)
    revByMonth.set(r.month, (revByMonth.get(r.month) ?? 0) + r.totalRevenue)
  }
  const months = monthOrder.filter((m) => dispByMonth.has(m))
  const dispData = months.map((m) => Math.round(dispByMonth.get(m) ?? 0))
  const pctData = months.map((m) => {
    const rev = revByMonth.get(m) ?? 0
    return rev > 0 ? Number((((dispByMonth.get(m) ?? 0) / rev) * 100).toFixed(2)) : 0
  })

  return {
    grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { data: ['Displacement €', 'Displacement %'], top: 0 },
    xAxis: { type: 'category', data: months, axisLabel: { color: COLORS.gray } },
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          color: COLORS.gray,
          formatter: (v: number) => formatCurrencyCompact(v),
        },
      },
      {
        type: 'value',
        position: 'right',
        axisLabel: { color: COLORS.gray, formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Displacement €',
        type: 'bar',
        data: dispData,
        itemStyle: { color: barColor, borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'Displacement %',
        type: 'line',
        yAxisIndex: 1,
        data: pctData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: lineColor },
        lineStyle: { color: lineColor, width: 2 },
      },
    ],
  }
}

function buildDonutOption(
  departures: { cabin: string; displacement: number }[],
  palette: string[],
): EChartsCoreOption {
  const byCabin = new Map<string, number>()
  for (const d of departures) {
    byCabin.set(d.cabin, (byCabin.get(d.cabin) ?? 0) + d.displacement)
  }
  const data = sortCabins([...byCabin.keys()]).map((cabin, i) => ({
    name: cabinLabel(cabin),
    value: Math.round(byCabin.get(cabin) ?? 0),
    itemStyle: { color: pickColor(palette, i) },
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}<br/>${formatCurrency(p.value)} (${p.percent}%)`,
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
        data,
      },
    ],
  }
}
