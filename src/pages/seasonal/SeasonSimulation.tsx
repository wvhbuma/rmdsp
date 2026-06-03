/*
 * SeasonSimulation — resultaten van de bottom-up fill-simulatie.
 *
 * KPI's (naïef / sim / full-cap / delta%) + per-cabin tabel + detailtabel
 * (gesorteerd op revenueDeltaPct) + grouped bar chart (naïef vs sim vs full-cap
 * per cabin). Databron: useSeasonalResults().sim.
 */
import { useMemo, useState } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import type { SeasonalSimulation } from '@/types/seasonal'
import { useSeasonalResults } from '@/hooks/useSeasonal'
import { CABIN_LABELS, CABIN_ORDER } from '@/config/seasonal'
import { COLORS } from '@/config/displacement'
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPct,
} from '@/utils/format'
import { KpiCard } from '@/components/displacement/KpiCard'
import { SectionCard } from '@/components/displacement/SectionCard'
import { EChart } from '@/components/displacement/EChart'
import { SelectFilter } from '@/components/seasonal/SelectFilter'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/displacement/StateViews'

const ALL = 'all'

export function SeasonSimulation() {
  const query = useSeasonalResults()

  if (query.isPending) return <LoadingState label="Simulatie laden…" />
  if (query.isError) return <ErrorState message={query.error.message} />
  if (query.data.sim.length === 0) {
    return (
      <EmptyState message="Nog geen simulatie. Maak eerst een seizoen aan via New Season." />
    )
  }

  return <SimulationView sim={query.data.sim} />
}

interface CabinAgg {
  n: number
  units: number
  naive: number
  sim: number
  full: number
}

function deltaPct(sim: number, naive: number): number {
  return naive > 0 ? ((sim - naive) / naive) * 100 : 0
}

function SimulationView({ sim }: { sim: SeasonalSimulation[] }) {
  const [route, setRoute] = useState<string>(ALL)

  const markets = useMemo(() => [...new Set(sim.map((s) => s.market))].sort(), [sim])
  const rows = useMemo(
    () => sim.filter((s) => route === ALL || s.market === route),
    [sim, route],
  )

  const totals = useMemo(() => {
    let naive = 0
    let simRev = 0
    let full = 0
    for (const s of rows) {
      naive += s.naiveRevenue
      simRev += s.simRevenue
      full += s.fullCapRevenue
    }
    return { naive, simRev, full }
  }, [rows])

  const byCabin = useMemo(() => {
    const map = new Map<string, CabinAgg>()
    for (const s of rows) {
      const a = map.get(s.modelCabin) ?? { n: 0, units: 0, naive: 0, sim: 0, full: 0 }
      a.n += 1
      a.units += s.targetUnits
      a.naive += s.naiveRevenue
      a.sim += s.simRevenue
      a.full += s.fullCapRevenue
      map.set(s.modelCabin, a)
    }
    return map
  }, [rows])

  const presentCabins = useMemo(
    () => CABIN_ORDER.filter((c) => byCabin.has(c)),
    [byCabin],
  )

  const detailRows = useMemo(
    () => [...rows].sort((a, b) => b.revenueDeltaPct - a.revenueDeltaPct),
    [rows],
  )

  const chartOption = useMemo(
    () => buildGroupedBar(presentCabins, byCabin),
    [presentCabins, byCabin],
  )

  const totalDelta = deltaPct(totals.simRev, totals.naive)

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl text-rm-dark">Simulatie</h1>
          <p className="font-body text-sm text-rm-gray">
            Bottom-up fill-simulatie t.o.v. naïeve en full-capacity revenue.
          </p>
        </div>
        <SelectFilter label="Route" value={route} onChange={setRoute}>
          <option value={ALL}>Alle</option>
          {markets.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </SelectFilter>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Naïef revenue" value={formatCurrencyCompact(totals.naive)} />
        <KpiCard label="Sim revenue" value={formatCurrencyCompact(totals.simRev)} accent="blue" />
        <KpiCard label="Full-cap revenue" value={formatCurrencyCompact(totals.full)} />
        <KpiCard
          label="Sim vs naïef"
          value={formatPct(totalDelta)}
          accent={totalDelta >= 0 ? 'blue' : 'red'}
        />
      </div>

      <SectionCard title="Revenue per cabin" subtitle="Naïef vs sim vs full-cap">
        <EChart option={chartOption} className="h-72" />
      </SectionCard>

      <SectionCard title="Per cabin">
        <table className="w-full border-collapse text-right font-body text-[13px]">
          <thead>
            <tr className="bg-rm-gray-light text-rm-dark">
              <th className="px-3 py-2 text-left font-display font-semibold">Cabin</th>
              <th className="px-3 py-2 font-display font-semibold">N</th>
              <th className="px-3 py-2 font-display font-semibold">Units</th>
              <th className="px-3 py-2 font-display font-semibold">Naïef rev</th>
              <th className="px-3 py-2 font-display font-semibold">Sim rev</th>
              <th className="px-3 py-2 font-display font-semibold">Sim yield</th>
              <th className="px-3 py-2 font-display font-semibold">Delta%</th>
            </tr>
          </thead>
          <tbody>
            {presentCabins.map((c) => {
              const a = byCabin.get(c)!
              const d = deltaPct(a.sim, a.naive)
              const simYield = a.units > 0 ? a.sim / a.units : 0
              return (
                <tr key={c} className="border-t border-rm-border hover:bg-rm-gray-light/50">
                  <td className="px-3 py-1.5 text-left font-medium text-rm-dark">
                    {CABIN_LABELS[c] ?? c}
                  </td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatNumber(a.n)}</td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatNumber(a.units)}</td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(a.naive)}</td>
                  <td className="px-3 py-1.5 text-rm-dark">{formatCurrency(a.sim)}</td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(simYield)}</td>
                  <td className={`px-3 py-1.5 font-medium ${d >= 0 ? 'text-lf-green' : 'text-villain'}`}>
                    {formatPct(d)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="Detail per vertrek" subtitle="Gesorteerd op revenue-delta">
        <div className="overflow-x-auto rounded-lg border border-rm-border">
          <table className="w-full border-collapse whitespace-nowrap text-right font-body text-[13px]">
            <thead>
              <tr className="bg-rm-gray-light text-rm-dark">
                <th className="px-3 py-2 text-left font-display font-semibold">Key</th>
                <th className="px-3 py-2 text-left font-display font-semibold">Cabin</th>
                <th className="px-3 py-2 font-display font-semibold">Units</th>
                <th className="px-3 py-2 font-display font-semibold">Target yield</th>
                <th className="px-3 py-2 font-display font-semibold">Naïef rev</th>
                <th className="px-3 py-2 font-display font-semibold">Sim rev</th>
                <th className="px-3 py-2 font-display font-semibold">Sim yield</th>
                <th className="px-3 py-2 font-display font-semibold">Delta</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((s) => (
                <tr key={s.key} className="border-t border-rm-border hover:bg-rm-gray-light/50">
                  <td className="px-3 py-1.5 text-left font-medium text-rm-dark">{s.key}</td>
                  <td className="px-3 py-1.5 text-left text-rm-gray">
                    {CABIN_LABELS[s.modelCabin] ?? s.modelCabin}
                  </td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatNumber(s.targetUnits)}</td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(s.targetYield)}</td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(s.naiveRevenue)}</td>
                  <td className="px-3 py-1.5 text-rm-dark">{formatCurrency(s.simRevenue)}</td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(s.simYield)}</td>
                  <td className={`px-3 py-1.5 font-medium ${s.revenueDelta >= 0 ? 'text-lf-green' : 'text-villain'}`}>
                    {formatCurrency(s.revenueDelta)} ({formatPct(s.revenueDeltaPct)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

function buildGroupedBar(
  cabins: readonly string[],
  byCabin: Map<string, CabinAgg>,
): EChartsCoreOption {
  const labels = cabins.map((c) => CABIN_LABELS[c] ?? c)
  return {
    grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { data: ['Naïef', 'Sim', 'Full cap'], top: 0, textStyle: { color: COLORS.gray } },
    xAxis: { type: 'category', data: labels, axisLabel: { color: COLORS.gray } },
    yAxis: {
      type: 'value',
      axisLabel: { color: COLORS.gray, formatter: (v: number) => formatCurrencyCompact(v) },
    },
    series: [
      {
        name: 'Naïef',
        type: 'bar',
        data: cabins.map((c) => Math.round(byCabin.get(c)?.naive ?? 0)),
        itemStyle: { color: COLORS.gray },
      },
      {
        name: 'Sim',
        type: 'bar',
        data: cabins.map((c) => Math.round(byCabin.get(c)?.sim ?? 0)),
        itemStyle: { color: COLORS.esBlue },
      },
      {
        name: 'Full cap',
        type: 'bar',
        data: cabins.map((c) => Math.round(byCabin.get(c)?.full ?? 0)),
        itemStyle: { color: COLORS.esMagenta },
      },
    ],
  }
}
