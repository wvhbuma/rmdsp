/*
 * SeasonMasks — AU-distributie per vertrek.
 *
 * Route-filter + departure-selector kiezen één mask-key; daarvan tonen we de
 * AU-verdeling als horizontale ECharts-bar (RBD op de y-as, J bovenaan) en een
 * mask-tabel. Kleuren per phase uit MASK_PHASE_COLORS; RBD-volgorde uit RBD_ORDER.
 */
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import type { SeasonalMask } from '@/types/seasonal'
import { useSeasonalResults } from '@/hooks/useSeasonal'
import { CABIN_LABELS, MASK_PHASE_COLORS, RBD_ORDER } from '@/config/seasonal'
import { COLORS } from '@/config/displacement'
import { formatCurrency, formatNumber } from '@/utils/format'
import { SectionCard } from '@/components/displacement/SectionCard'
import { EChart } from '@/components/displacement/EChart'
import { PhaseBadge } from '@/components/seasonal/PhaseBadge'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/displacement/StateViews'

const ALL = 'all'

export function SeasonMasks() {
  const query = useSeasonalResults()

  if (query.isPending) return <LoadingState label="Maskers laden…" />
  if (query.isError) return <ErrorState message={query.error.message} />
  if (query.data.masks.length === 0) {
    return (
      <EmptyState message="Nog geen maskers. Maak eerst een seizoen aan via New Season." />
    )
  }

  return <MasksView masks={query.data.masks} />
}

interface KeyInfo {
  key: string
  market: string
  cabin: string
  date: string
}

function rbdRank(rbd: string): number {
  const i = RBD_ORDER.indexOf(rbd)
  return i === -1 ? RBD_ORDER.length : i
}

function MasksView({ masks }: { masks: SeasonalMask[] }) {
  const [route, setRoute] = useState<string>(ALL)
  const [selectedKey, setSelectedKey] = useState<string>('')

  const markets = useMemo(
    () => [...new Set(masks.map((m) => m.market))].sort(),
    [masks],
  )

  // Eén KeyInfo per unieke key (eerste voorkomen levert market/cabin/date).
  const keyInfos = useMemo(() => {
    const map = new Map<string, KeyInfo>()
    for (const m of masks) {
      if (!map.has(m.key)) {
        map.set(m.key, { key: m.key, market: m.market, cabin: m.modelCabin, date: m.departureDate })
      }
    }
    return [...map.values()]
  }, [masks])

  // Keys gefilterd op de route-keuze.
  const filteredKeys = useMemo(
    () => keyInfos.filter((k) => route === ALL || k.market === route),
    [keyInfos, route],
  )

  // Effectieve key: gekozen key als die nog in de gefilterde set zit, anders de eerste.
  const effectiveKey =
    filteredKeys.some((k) => k.key === selectedKey) && selectedKey !== ''
      ? selectedKey
      : (filteredKeys[0]?.key ?? '')

  const rows = useMemo(
    () => masks.filter((m) => m.key === effectiveKey),
    [masks, effectiveKey],
  )

  const chartOption = useMemo(() => buildAuChart(rows), [rows])

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl text-rm-dark">Maskers</h1>
          <p className="font-body text-sm text-rm-gray">
            AU-distributie per vertrek over de booking classes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select label="Route" value={route} onChange={setRoute}>
            <option value={ALL}>Alle</option>
            {markets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select label="Vertrek" value={effectiveKey} onChange={setSelectedKey}>
            {filteredKeys.map((k) => (
              <option key={k.key} value={k.key}>
                {k.market} · {CABIN_LABELS[k.cabin] ?? k.cabin} · {k.date}
              </option>
            ))}
          </Select>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState message="Geen masker voor deze selectie." />
      ) : (
        <>
          <SectionCard title="AU-distributie" subtitle="Cumulatieve authorization units per RBD">
            <EChart option={chartOption} className="h-96" />
          </SectionCard>

          <SectionCard title="Mask-detail">
            <MaskTable rows={rows} />
          </SectionCard>
        </>
      )}
    </div>
  )
}

function buildAuChart(rows: SeasonalMask[]): EChartsCoreOption {
  // Sorteer J→A, dan T,W,V (RBD_ORDER); inverse y-as zet J bovenaan.
  const sorted = [...rows].sort((a, b) => rbdRank(a.rbd) - rbdRank(b.rbd))
  return {
    grid: { left: 8, right: 20, top: 24, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number }) =>
        `${p.name}<br/>AU cum: ${formatNumber(p.value)}`,
    },
    xAxis: {
      type: 'value',
      name: 'AU cum',
      axisLabel: { color: COLORS.gray, formatter: (v: number) => formatNumber(v) },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: sorted.map((r) => r.rbd),
      axisLabel: { color: COLORS.gray },
    },
    series: [
      {
        type: 'bar',
        barWidth: '60%',
        data: sorted.map((r) => ({
          value: r.auCum,
          itemStyle: { color: MASK_PHASE_COLORS[r.phase] ?? COLORS.gray },
        })),
      },
    ],
  }
}

function MaskTable({ rows }: { rows: SeasonalMask[] }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => rbdRank(a.rbd) - rbdRank(b.rbd)),
    [rows],
  )
  return (
    <div className="overflow-x-auto rounded-lg border border-rm-border">
      <table className="w-full border-collapse text-right font-body text-[13px]">
        <thead>
          <tr className="bg-rm-gray-light text-rm-dark">
            <th className="px-3 py-2 text-left font-display font-semibold">RBD</th>
            <th className="px-3 py-2 font-display font-semibold">Fare</th>
            <th className="px-3 py-2 font-display font-semibold">Protection</th>
            <th className="px-3 py-2 font-display font-semibold">AU Cum</th>
            <th className="px-3 py-2 text-left font-display font-semibold">Phase</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => (
            <tr key={m.rbd} className="border-t border-rm-border hover:bg-rm-gray-light/50">
              <td className="px-3 py-1.5 text-left font-medium text-rm-dark">{m.rbd}</td>
              <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(m.fare)}</td>
              <td className="px-3 py-1.5 text-rm-gray">{formatNumber(m.protection)}</td>
              <td className="px-3 py-1.5 text-rm-dark">{formatNumber(m.auCum)}</td>
              <td className="px-3 py-1.5 text-left">
                <PhaseBadge phase={m.phase} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: ReactNode
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-rm-border bg-rm-surface px-2.5 py-1.5">
      <span className="font-display text-[11px] uppercase tracking-wide text-rm-gray">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[260px] bg-transparent font-body text-[13px] text-rm-dark focus:outline-none"
      >
        {children}
      </select>
    </label>
  )
}
