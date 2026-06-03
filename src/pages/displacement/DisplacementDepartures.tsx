/*
 * Departure Details — vertrek-niveau analyse voor één maand.
 *
 * Cabin-tabs sturen de LF-heatmap (custom HTML-tabel) en de pax-flow stacked bar.
 * Klik op een heatmap-rij → die vertrekdatum wordt geselecteerd en de pax-flow
 * toont dat specifieke vertrek (anders: aggregaat over de maand). Onderaan een
 * inklapbare vertrektabel (default dicht).
 *
 * Heatmap/chart gebruiken korte stationsnamen (BRU→ANC); de tabel gebruikt lange
 * namen (Brussels → Prague).
 */
import { useMemo, useState } from 'react'
import type {
  DisplacementDeparture,
  DisplacementLeg,
  DisplacementResponse,
} from '@/types/displacement'
import { useDisplacement } from '@/hooks/useDisplacement'
import {
  defaultFilter,
  effectiveMonths,
  filterDepartures,
  filterLegs,
  type DisplacementFilter,
} from '@/utils/displacement'
import {
  cabinBgClass,
  cabinLabel,
  COLORS,
  sortCabins,
  stationShort,
} from '@/config/displacement'
import {
  formatCurrency,
  formatLf,
  formatNumber,
} from '@/utils/format'
import { FilterBar } from '@/components/displacement/FilterBar'
import { EChart } from '@/components/displacement/EChart'
import { SectionCard } from '@/components/displacement/SectionCard'
import { LfHeatmap } from '@/components/displacement/LfHeatmap'
import { Icon } from '@/layout/icons'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/displacement/StateViews'
import type { EChartsCoreOption } from 'echarts/core'

export function DisplacementDepartures() {
  const query = useDisplacement()

  if (query.isPending) return <LoadingState />
  if (query.isError) return <ErrorState message={query.error.message} />
  if (query.data.departures.length === 0) return <EmptyState />

  return <DeparturesView data={query.data} />
}

function DeparturesView({ data }: { data: DisplacementResponse }) {
  const [filter, setFilter] = useState<DisplacementFilter>(() =>
    defaultFilter(data, 'single'),
  )
  const cabins = useMemo(() => sortCabins(data.cabins), [data.cabins])
  const [activeCabin, setActiveCabin] = useState<string>(cabins[0] ?? '')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [tableOpen, setTableOpen] = useState(false)

  const months = useMemo(() => effectiveMonths(data, filter), [data, filter])

  // Heatmap + pax flow: alleen de actieve cabin (tabs), los van de FilterBar-cabin.
  const cabinFilter = useMemo<DisplacementFilter>(
    () => ({ ...filter, cabins: activeCabin ? [activeCabin] : [] }),
    [filter, activeCabin],
  )
  const cabinLegs = useMemo(
    () => filterLegs(data, cabinFilter, months),
    [data, cabinFilter, months],
  )
  const cabinDepartures = useMemo(
    () => filterDepartures(data, cabinFilter, months),
    [data, cabinFilter, months],
  )

  // Vertrektabel: respecteert de FilterBar-cabin (multi).
  const tableDepartures = useMemo(
    () => filterDepartures(data, filter, months),
    [data, filter, months],
  )

  const paxFlowOption = useMemo(
    () => buildPaxFlowOption(cabinLegs, selectedDate),
    [cabinLegs, selectedDate],
  )

  return (
    <div>
      <FilterBar data={data} value={filter} onChange={setFilter} periodMode="single" />

      <div className="space-y-6 p-6">
        <CabinTabs
          cabins={cabins}
          active={activeCabin}
          onSelect={(c) => {
            setActiveCabin(c)
            setSelectedDate(null)
          }}
        />

        <SectionCard
          title="Load factor per leg"
          subtitle="Klik op een vertrek om de pax-flow te bekijken"
        >
          <LfHeatmap
            legs={cabinLegs}
            departures={cabinDepartures}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d === selectedDate ? null : d)}
          />
        </SectionCard>

        <SectionCard
          title="Pax-flow per leg"
          subtitle={
            selectedDate
              ? `Vertrek ${selectedDate} · ${cabinLabel(activeCabin)}`
              : `Aggregaat ${cabinLabel(activeCabin)} · hele maand`
          }
        >
          {cabinLegs.length === 0 ? (
            <EmptyState />
          ) : (
            <EChart option={paxFlowOption} className="h-80" />
          )}
        </SectionCard>

        <CollapsibleTable
          open={tableOpen}
          onToggle={() => setTableOpen((v) => !v)}
          departures={tableDepartures}
          stationNames={data.stationNames}
        />
      </div>
    </div>
  )
}

function CabinTabs({
  cabins,
  active,
  onSelect,
}: {
  cabins: string[]
  active: string
  onSelect: (cabin: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {cabins.map((c) => {
        const isActive = c === active
        // Actieve tab krijgt de cabin-kleur als achtergrond (via theme-token-class).
        return (
          <button
            key={c}
            type="button"
            onClick={() => onSelect(c)}
            className={`rounded-md px-3 py-1.5 font-display text-[13px] font-medium transition-colors ${
              isActive
                ? `text-white ${cabinBgClass(c)}`
                : 'bg-rm-surface text-rm-gray border border-rm-border hover:bg-rm-gray-light'
            }`}
          >
            {cabinLabel(c)}
          </button>
        )
      })}
    </div>
  )
}

function buildPaxFlowOption(
  legRows: DisplacementLeg[],
  selectedDate: string | null,
): EChartsCoreOption {
  const rows = selectedDate
    ? legRows.filter((r) => r.date === selectedDate)
    : legRows

  interface Agg {
    leg: number
    label: string
    board: number
    through: number
    alight: number
  }
  const byLeg = new Map<number, Agg>()
  for (const r of rows) {
    for (const l of r.legs) {
      const agg = byLeg.get(l.leg) ?? {
        leg: l.leg,
        label: shortLegLabel(l.label),
        board: 0,
        through: 0,
        alight: 0,
      }
      agg.board += l.board
      agg.through += l.through
      agg.alight += l.alight
      byLeg.set(l.leg, agg)
    }
  }
  const aggs = [...byLeg.values()].sort((a, b) => a.leg - b.leg)
  const labels = aggs.map((a) => a.label)

  return {
    grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number }[]) =>
        params
          .map((p) => `${p.seriesName}: ${formatNumber(Math.abs(p.value))}`)
          .join('<br/>'),
    },
    legend: { data: ['Instappers', 'Doorgaand', 'Uitstappers'], top: 0, textStyle: { color: COLORS.gray } },
    xAxis: { type: 'category', data: labels, axisLabel: { color: COLORS.gray } },
    yAxis: {
      type: 'value',
      axisLabel: { color: COLORS.gray, formatter: (v: number) => String(Math.abs(v)) },
    },
    series: [
      {
        name: 'Instappers',
        type: 'bar',
        stack: 'flow',
        data: aggs.map((a) => a.board),
        itemStyle: { color: COLORS.esBlue },
      },
      {
        name: 'Doorgaand',
        type: 'bar',
        stack: 'flow',
        data: aggs.map((a) => a.through),
        itemStyle: { color: COLORS.gray },
      },
      {
        name: 'Uitstappers',
        type: 'bar',
        stack: 'flow',
        data: aggs.map((a) => -a.alight),
        itemStyle: { color: COLORS.esMagenta },
      },
    ],
  }
}

/** "BEMI→ANCT" → "BRU→ANC". */
function shortLegLabel(label: string): string {
  return label
    .split('→')
    .map((c) => stationShort(c.trim()))
    .join('→')
}

/** "BEMI-PRA" → "Brussels → Prague" via stationNames. */
function formatRouteLong(code: string, stationNames: Record<string, string>): string {
  return code
    .split('-')
    .map((c) => stationNames[c] ?? c)
    .join(' → ')
}

function CollapsibleTable({
  open,
  onToggle,
  departures,
  stationNames,
}: {
  open: boolean
  onToggle: () => void
  departures: DisplacementDeparture[]
  stationNames: Record<string, string>
}) {
  const sorted = [...departures].sort(
    (a, b) => a.date.localeCompare(b.date) || a.cabin.localeCompare(b.cabin),
  )
  return (
    <section className="rounded-lg border border-rm-border bg-rm-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <h3 className="font-display font-semibold text-sm text-rm-dark">
            Vertrekdetails
          </h3>
          <p className="font-body text-xs text-rm-gray">
            {sorted.length} vertrekken
          </p>
        </div>
        <Icon
          name="chevron-down"
          className={`h-4 w-4 text-rm-gray transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {/* hidden i.p.v. unmount: behoudt scrollpositie + voorkomt herrender-kosten. */}
      <div className={open ? 'block' : 'hidden'}>
        <div className="overflow-x-auto border-t border-rm-border">
          <table className="w-full border-collapse text-right font-body text-[13px]">
            <thead>
              <tr className="bg-rm-gray-light text-rm-dark">
                <th className="px-3 py-2 text-left font-display font-semibold">Datum</th>
                <th className="px-3 py-2 text-left font-display font-semibold">Route</th>
                <th className="px-3 py-2 text-left font-display font-semibold">Cabin</th>
                <th className="px-3 py-2 font-display font-semibold">Cap.</th>
                <th className="px-3 py-2 font-display font-semibold">Units</th>
                <th className="px-3 py-2 font-display font-semibold">LF</th>
                <th className="px-3 py-2 font-display font-semibold">Actual</th>
                <th className="px-3 py-2 font-display font-semibold">Optimal</th>
                <th className="px-3 py-2 font-display font-semibold">Displ.</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => (
                <tr
                  key={`${d.date}-${d.cabin}-${i}`}
                  className="border-t border-rm-border hover:bg-rm-gray-light/50"
                >
                  <td className="px-3 py-1.5 text-left font-medium text-rm-dark">{d.date}</td>
                  <td className="px-3 py-1.5 text-left text-rm-gray">
                    {formatRouteLong(d.route, stationNames)}
                  </td>
                  <td className="px-3 py-1.5 text-left text-rm-gray">
                    {cabinLabel(d.cabin)}
                    {d.constrained && (
                      <span className="ml-1.5 rounded bg-villain/10 px-1 text-[10px] text-villain">
                        constrained
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatNumber(d.capacity)}</td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatNumber(d.units)}</td>
                  <td className="px-3 py-1.5 text-rm-dark">{formatLf(d.lf)}</td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(d.actual)}</td>
                  <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(d.optimal)}</td>
                  <td className="px-3 py-1.5 font-medium text-villain">
                    {formatCurrency(d.displacement)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
