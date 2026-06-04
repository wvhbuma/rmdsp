/*
 * Budget & Targets — gedetailleerde seizoens-targets met PY-vergelijking.
 *
 * Hoofdtabel: één rij per vertrek × cabin, met CY/PY-waarden en indices
 * (CY/PY × 100) voor capacity, units, yield, revenue en RAU. Daarboven een
 * route-summary met dezelfde index-kolommen. Indices: groen ≥100, rood <100.
 *
 * Filters (Route / Cabin / Maand) zijn seizoen-specifiek; de displacement-
 * FilterBar is gebonden aan het displacement-datamodel en hier niet herbruikbaar.
 */
import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import type { SeasonalTarget } from '@/types/seasonal'
import { useSeasonalResults } from '@/hooks/useSeasonal'
import { CABIN_LABELS, CABIN_ORDER } from '@/config/seasonal'
import { formatCurrency, formatNumber } from '@/utils/format'
import { SectionCard } from '@/components/displacement/SectionCard'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/displacement/StateViews'
import { NoSeasonData } from '@/components/seasonal/NoSeasonData'

export function BudgetTargets() {
  const query = useSeasonalResults()

  if (query.isPending) return <LoadingState label="Loading targets…" />
  if (query.isError) {
    return <ErrorState title="Could not load seasonal data" message={query.error.message} />
  }
  if (query.data.targets.length === 0) {
    return <NoSeasonData message="No targets yet." />
  }

  return <TargetsView targets={query.data.targets} />
}

const ALL = 'all'
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function monthLabel(key: string): string {
  const d = new Date(`${key}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return key
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(d)
}

function dow(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return Number.isNaN(d.getTime()) ? '' : DOW[d.getDay()]
}

/** Index = CY / PY × 100; null als er geen PY-basis is. */
function index(cy: number, py: number): number | null {
  return py > 0 ? (cy / py) * 100 : null
}

/** PY-capaciteit: expliciet veld, anders afgeleid uit units / load factor. */
function pyCapacityOf(t: SeasonalTarget): number {
  if (typeof t.pyCapacity === 'number' && t.pyCapacity > 0) return t.pyCapacity
  return t.pyLf > 0 ? t.pyUnitsSold / t.pyLf : 0
}

function cabinRank(cabin: string): number {
  const i = (CABIN_ORDER as readonly string[]).indexOf(cabin)
  return i === -1 ? CABIN_ORDER.length : i
}

function TargetsView({ targets }: { targets: SeasonalTarget[] }) {
  const [route, setRoute] = useState<string>(ALL)
  const [cabin, setCabin] = useState<string>(ALL)
  const [month, setMonth] = useState<string>(ALL)

  const markets = useMemo(
    () => [...new Set(targets.map((t) => t.market))].sort(),
    [targets],
  )
  const cabins = useMemo(
    () => CABIN_ORDER.filter((c) => targets.some((t) => t.modelCabin === c)),
    [targets],
  )
  const months = useMemo(
    () => [...new Set(targets.map((t) => monthKey(t.departureDate)))].sort(),
    [targets],
  )

  const filtered = useMemo(
    () =>
      targets.filter(
        (t) =>
          (route === ALL || t.market === route) &&
          (cabin === ALL || t.modelCabin === cabin) &&
          (month === ALL || monthKey(t.departureDate) === month),
      ),
    [targets, route, cabin, month],
  )

  function exportExcel() {
    // Detail: zelfde sortering als de tabel; respecteert de actieve filters.
    const detail = [...filtered].sort(
      (a, b) =>
        a.departureDate.localeCompare(b.departureDate) ||
        a.market.localeCompare(b.market) ||
        cabinRank(a.modelCabin) - cabinRank(b.modelCabin),
    )
    const targetRows = detail.map((t) => ({
      Date: t.departureDate,
      DOW: dow(t.departureDate),
      Route: t.market,
      Cabin: CABIN_LABELS[t.modelCabin] ?? t.modelCabin,
      ...indexColumns(rowFromTarget(t)),
    }))

    const byRoute = aggregate(filtered, (t) => t.market)
    const summaryRows = [...byRoute.keys()]
      .sort()
      .map((market) => ({ Route: market, ...indexColumns(rowFromAgg(byRoute.get(market)!)) }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(targetRows), 'Targets')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary')
    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `seasonal_targets_${today}.xlsx`)
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl text-rm-dark">Budget &amp; Targets</h1>
          <p className="font-body text-sm text-rm-gray">
            Season targets per departure with prior-year (PY) indices.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Route" value={route} onChange={setRoute} options={markets} />
          <FilterSelect
            label="Cabin"
            value={cabin}
            onChange={setCabin}
            options={cabins}
            render={(c) => CABIN_LABELS[c] ?? c}
          />
          <FilterSelect
            label="Month"
            value={month}
            onChange={setMonth}
            options={months}
            render={monthLabel}
          />
          <button
            type="button"
            onClick={exportExcel}
            disabled={filtered.length === 0}
            className="rounded-md bg-es-blue px-4 py-2 font-display text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export to Excel
          </button>
        </div>
      </header>

      <SectionCard title="Per route" subtitle="Summary of the current selection">
        <RouteSummaryTable targets={filtered} />
      </SectionCard>

      <SectionCard title="Departure detail" subtitle={`${filtered.length} departures × cabin`}>
        {filtered.length === 0 ? <EmptyState /> : <DetailTable targets={filtered} />}
      </SectionCard>
    </div>
  )
}

/* ── Filters ────────────────────────────────────────────────────────────── */

function FilterSelect({
  label,
  value,
  onChange,
  options,
  render,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  render?: (v: string) => string
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-rm-border bg-rm-surface px-2.5 py-1.5">
      <span className="font-display text-[11px] uppercase tracking-wide text-rm-gray">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-body text-[13px] text-rm-dark focus:outline-none"
      >
        <option value={ALL}>All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {render ? render(o) : o}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ── Index-cel (groen ≥100, rood <100) ──────────────────────────────────── */

function IdxCell({ idx }: { idx: number | null }) {
  if (idx === null) {
    return <td className="px-3 py-1.5 text-right text-rm-gray">—</td>
  }
  const rounded = Math.round(idx)
  return (
    <td
      className={`px-3 py-1.5 text-right font-medium ${
        rounded >= 100 ? 'text-lf-green' : 'text-villain'
      }`}
    >
      {rounded}
    </td>
  )
}

function Num({ value }: { value: string }) {
  return <td className="px-3 py-1.5 text-right text-rm-gray">{value}</td>
}

/* ── Route-summary ──────────────────────────────────────────────────────── */

interface Agg {
  cap: number
  units: number
  rev: number
  pyCap: number
  pyUnits: number
  pyRev: number
}

function aggregate(targets: SeasonalTarget[], keyFn: (t: SeasonalTarget) => string): Map<string, Agg> {
  const map = new Map<string, Agg>()
  for (const t of targets) {
    const k = keyFn(t)
    const a = map.get(k) ?? { cap: 0, units: 0, rev: 0, pyCap: 0, pyUnits: 0, pyRev: 0 }
    a.cap += t.capacity
    a.units += t.targetUnits
    a.rev += t.targetRevenue
    a.pyCap += pyCapacityOf(t)
    a.pyUnits += t.pyUnitsSold
    a.pyRev += t.pyRevenue
    map.set(k, a)
  }
  return map
}

const INDEX_HEAD = [
  'CY Cap', 'PY Cap', 'Cap Idx',
  'CY Units', 'PY Units', 'Units Idx',
  'CY Yield', 'PY Yield', 'Yield Idx',
  'CY Rev', 'PY Rev', 'Rev Idx',
  'CY RAU', 'PY RAU', 'RAU Idx',
]

interface IndexRow {
  cap: number
  pyCap: number
  units: number
  pyUnits: number
  cyYield: number
  pyYield: number
  rev: number
  pyRev: number
  cyRau: number
  pyRau: number
}

/** Geaggregeerde rij (route-summary): yield = rev/units, RAU = rev/cap. */
function rowFromAgg(a: Agg): IndexRow {
  const pyRauDenom = a.pyCap > 0 ? a.pyCap : a.cap
  return {
    cap: a.cap,
    pyCap: a.pyCap,
    units: a.units,
    pyUnits: a.pyUnits,
    cyYield: a.units > 0 ? a.rev / a.units : 0,
    pyYield: a.pyUnits > 0 ? a.pyRev / a.pyUnits : 0,
    rev: a.rev,
    pyRev: a.pyRev,
    cyRau: a.cap > 0 ? a.rev / a.cap : 0,
    pyRau: pyRauDenom > 0 ? a.pyRev / pyRauDenom : 0,
  }
}

/** Detailrij: gebruikt de target-eigen yield-velden; PY RAU valt terug op CY cap. */
function rowFromTarget(t: SeasonalTarget): IndexRow {
  const pyCap = pyCapacityOf(t)
  const pyRauDenom = pyCap > 0 ? pyCap : t.capacity
  return {
    cap: t.capacity,
    pyCap,
    units: t.targetUnits,
    pyUnits: t.pyUnitsSold,
    cyYield: t.targetYield,
    pyYield: t.pyYield,
    rev: t.targetRevenue,
    pyRev: t.pyRevenue,
    cyRau: t.capacity > 0 ? t.targetRevenue / t.capacity : 0,
    pyRau: pyRauDenom > 0 ? t.pyRevenue / pyRauDenom : 0,
  }
}

/** Index-kolommen (CY/PY/Idx) als platte object voor Excel-export. */
function indexColumns(r: IndexRow): Record<string, number | string> {
  const idx = (cy: number, py: number): number | string => {
    const v = index(cy, py)
    return v === null ? '' : Math.round(v)
  }
  return {
    'CY Cap': Math.round(r.cap),
    'PY Cap': Math.round(r.pyCap),
    'Cap Idx': idx(r.cap, r.pyCap),
    'CY Units': Math.round(r.units),
    'PY Units': Math.round(r.pyUnits),
    'Units Idx': idx(r.units, r.pyUnits),
    'CY Yield': Math.round(r.cyYield),
    'PY Yield': Math.round(r.pyYield),
    'Yield Idx': idx(r.cyYield, r.pyYield),
    'CY Rev': Math.round(r.rev),
    'PY Rev': Math.round(r.pyRev),
    'Rev Idx': idx(r.rev, r.pyRev),
    'CY RAU': Math.round(r.cyRau),
    'PY RAU': Math.round(r.pyRau),
    'RAU Idx': idx(r.cyRau, r.pyRau),
  }
}

/** Render de 15 index-cellen (CY/PY/Idx voor cap, units, yield, rev, rau). */
function IndexCells({ r }: { r: IndexRow }) {
  return (
    <>
      <Num value={formatNumber(r.cap)} />
      <Num value={formatNumber(r.pyCap)} />
      <IdxCell idx={index(r.cap, r.pyCap)} />
      <Num value={formatNumber(r.units)} />
      <Num value={formatNumber(r.pyUnits)} />
      <IdxCell idx={index(r.units, r.pyUnits)} />
      <Num value={formatCurrency(r.cyYield)} />
      <Num value={formatCurrency(r.pyYield)} />
      <IdxCell idx={index(r.cyYield, r.pyYield)} />
      <Num value={formatCurrency(r.rev)} />
      <Num value={formatCurrency(r.pyRev)} />
      <IdxCell idx={index(r.rev, r.pyRev)} />
      <Num value={formatCurrency(r.cyRau)} />
      <Num value={formatCurrency(r.pyRau)} />
      <IdxCell idx={index(r.cyRau, r.pyRau)} />
    </>
  )
}

function RouteSummaryTable({ targets }: { targets: SeasonalTarget[] }) {
  const byRoute = useMemo(() => aggregate(targets, (t) => t.market), [targets])
  const routes = useMemo(() => [...byRoute.keys()].sort(), [byRoute])

  if (routes.length === 0) return <EmptyState />

  return (
    <div className="overflow-x-auto rounded-lg border border-rm-border">
      <table className="w-full border-collapse whitespace-nowrap font-body text-[13px]">
        <thead>
          <tr className="bg-rm-gray-light text-rm-dark">
            <th className="px-3 py-2 text-left font-display font-semibold">Route</th>
            {INDEX_HEAD.map((h) => (
              <th key={h} className="px-3 py-2 text-right font-display font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {routes.map((r) => (
            <tr key={r} className="border-t border-rm-border hover:bg-rm-gray-light/50">
              <td className="px-3 py-1.5 text-left font-medium text-rm-dark">{r}</td>
              <IndexCells r={rowFromAgg(byRoute.get(r)!)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Departure detail (één rij per vertrek × cabin) ─────────────────────── */

function DetailTable({ targets }: { targets: SeasonalTarget[] }) {
  const rows = useMemo(
    () =>
      [...targets].sort(
        (a, b) =>
          a.departureDate.localeCompare(b.departureDate) ||
          a.market.localeCompare(b.market) ||
          cabinRank(a.modelCabin) - cabinRank(b.modelCabin),
      ),
    [targets],
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-rm-border">
      <table className="w-full border-collapse whitespace-nowrap font-body text-[13px]">
        <thead>
          <tr className="bg-rm-gray-light text-rm-dark">
            <th className="px-3 py-2 text-left font-display font-semibold">Date</th>
            <th className="px-3 py-2 text-left font-display font-semibold">DOW</th>
            <th className="px-3 py-2 text-left font-display font-semibold">Route</th>
            <th className="px-3 py-2 text-left font-display font-semibold">Cabin</th>
            {INDEX_HEAD.map((h) => (
              <th key={h} className="px-3 py-2 text-right font-display font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.key} className="border-t border-rm-border hover:bg-rm-gray-light/50">
              <td className="px-3 py-1.5 text-left font-medium text-rm-dark">{t.departureDate}</td>
              <td className="px-3 py-1.5 text-left text-rm-gray">{dow(t.departureDate)}</td>
              <td className="px-3 py-1.5 text-left text-rm-gray">{t.market}</td>
              <td className="px-3 py-1.5 text-left text-rm-gray">
                {CABIN_LABELS[t.modelCabin] ?? t.modelCabin}
              </td>
              <IndexCells r={rowFromTarget(t)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
