/*
 * Budget & Targets — seizoens-targets met PY-vergelijking.
 *
 * Bevat de targets-inhoud (voorheen gepland als SeasonTargets): route-summary +
 * detailtabel met PY-kolommen links en target-kolommen rechts, plus profiel-,
 * binding- en gapfill-badges. Databron: useSeasonalResults().
 *
 * Filters (Route / Cabin / Maand) zijn seizoen-specifiek; de displacement-
 * FilterBar is gebonden aan het displacement-datamodel en hier niet herbruikbaar.
 */
import { useMemo, useState } from 'react'
import type { SeasonalTarget } from '@/types/seasonal'
import { useSeasonalResults } from '@/hooks/useSeasonal'
import { CABIN_LABELS, CABIN_ORDER } from '@/config/seasonal'
import { formatCurrency, formatLf, formatNumber } from '@/utils/format'
import { SectionCard } from '@/components/displacement/SectionCard'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/displacement/StateViews'
import { ProfileBadge } from '@/components/seasonal/ProfileBadge'
import { BindingBadge } from '@/components/seasonal/BindingBadge'
import { GapFillBadge } from '@/components/seasonal/GapFillBadge'

export function BudgetTargets() {
  const query = useSeasonalResults()

  if (query.isPending) return <LoadingState label="Targets laden…" />
  if (query.isError) return <ErrorState message={query.error.message} />
  if (query.data.targets.length === 0) {
    return (
      <EmptyState message="Nog geen targets. Maak eerst een seizoen aan via New Season." />
    )
  }

  return <TargetsView targets={query.data.targets} />
}

const ALL = 'all'

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function monthLabel(key: string): string {
  const d = new Date(`${key}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return key
  return new Intl.DateTimeFormat('nl-NL', { month: 'short', year: 'numeric' }).format(d)
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

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl text-rm-dark">Budget &amp; Targets</h1>
          <p className="font-body text-sm text-rm-gray">
            Seizoens-targets met vergelijking t.o.v. vorig jaar (PY).
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
            label="Maand"
            value={month}
            onChange={setMonth}
            options={months}
            render={monthLabel}
          />
        </div>
      </header>

      <SectionCard title="Per route" subtitle="Samenvatting van de huidige selectie">
        <RouteSummaryTable targets={filtered} />
      </SectionCard>

      <SectionCard
        title="Target-detail"
        subtitle={`${filtered.length} producten · PY links, target rechts`}
      >
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <TargetDetailTable targets={filtered} />
        )}
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
        <option value={ALL}>Alle</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {render ? render(o) : o}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ── Route-summary ──────────────────────────────────────────────────────── */

interface Agg {
  units: number
  revenue: number
  capacity: number
  pyRevenue: number
}

function aggregateBy(
  targets: SeasonalTarget[],
  keyFn: (t: SeasonalTarget) => string,
): Map<string, Agg> {
  const map = new Map<string, Agg>()
  for (const t of targets) {
    const k = keyFn(t)
    const a = map.get(k) ?? { units: 0, revenue: 0, capacity: 0, pyRevenue: 0 }
    a.units += t.targetUnits
    a.revenue += t.targetRevenue
    a.capacity += t.capacity
    a.pyRevenue += t.pyRevenue
    map.set(k, a)
  }
  return map
}

function RouteSummaryTable({ targets }: { targets: SeasonalTarget[] }) {
  const byRoute = useMemo(() => aggregateBy(targets, (t) => t.market), [targets])
  const routes = useMemo(() => [...byRoute.keys()].sort(), [byRoute])

  if (routes.length === 0) return <EmptyState />

  return (
    <div className="overflow-x-auto rounded-lg border border-rm-border">
      <table className="w-full border-collapse text-right font-body text-[13px]">
        <thead>
          <tr className="bg-rm-gray-light text-rm-dark">
            <th className="px-3 py-2 text-left font-display font-semibold">Route</th>
            <th className="px-3 py-2 font-display font-semibold">Units</th>
            <th className="px-3 py-2 font-display font-semibold">LF</th>
            <th className="px-3 py-2 font-display font-semibold">Yield</th>
            <th className="px-3 py-2 font-display font-semibold">Revenue</th>
            <th className="px-3 py-2 font-display font-semibold">vs PY</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r) => {
            const a = byRoute.get(r)!
            const lf = a.capacity > 0 ? a.units / a.capacity : 0
            const yld = a.units > 0 ? a.revenue / a.units : 0
            const idx = a.pyRevenue > 0 ? Math.round((a.revenue / a.pyRevenue) * 100) : null
            return (
              <tr key={r} className="border-t border-rm-border hover:bg-rm-gray-light/50">
                <td className="px-3 py-1.5 text-left font-medium text-rm-dark">{r}</td>
                <td className="px-3 py-1.5 text-rm-gray">{formatNumber(a.units)}</td>
                <td className="px-3 py-1.5 text-rm-gray">{formatLf(lf)}</td>
                <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(yld)}</td>
                <td className="px-3 py-1.5 text-rm-dark">{formatCurrency(a.revenue)}</td>
                <td className="px-3 py-1.5 text-rm-gray">{idx === null ? '—' : idx}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Target-detail (PY links, target rechts) ────────────────────────────── */

function TargetDetailTable({ targets }: { targets: SeasonalTarget[] }) {
  const rows = useMemo(
    () =>
      [...targets].sort(
        (a, b) =>
          a.market.localeCompare(b.market) ||
          a.departureDate.localeCompare(b.departureDate) ||
          a.modelCabin.localeCompare(b.modelCabin),
      ),
    [targets],
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-rm-border">
      <table className="w-full border-collapse whitespace-nowrap text-right font-body text-[13px]">
        <thead>
          <tr className="bg-rm-gray-light text-rm-dark">
            <th className="px-3 py-2 text-left font-display font-semibold">Vertrek</th>
            <th className="px-3 py-2 text-left font-display font-semibold">Route</th>
            <th className="px-3 py-2 text-left font-display font-semibold">Cabin</th>
            <th className="bg-rm-bg px-3 py-2 font-display font-semibold">PY units</th>
            <th className="bg-rm-bg px-3 py-2 font-display font-semibold">PY LF</th>
            <th className="bg-rm-bg px-3 py-2 font-display font-semibold">PY yield</th>
            <th className="bg-rm-bg px-3 py-2 font-display font-semibold">PY rev</th>
            <th className="bg-rm-bg px-3 py-2 text-left font-display font-semibold">Gap</th>
            <th className="px-3 py-2 font-display font-semibold">Units</th>
            <th className="px-3 py-2 font-display font-semibold">LF</th>
            <th className="px-3 py-2 font-display font-semibold">Yield</th>
            <th className="px-3 py-2 font-display font-semibold">Rev</th>
            <th className="px-3 py-2 font-display font-semibold">RAU</th>
            <th className="px-3 py-2 text-left font-display font-semibold">RBD</th>
            <th className="px-3 py-2 text-left font-display font-semibold">Profiel</th>
            <th className="px-3 py-2 text-left font-display font-semibold">Binding</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.key} className="border-t border-rm-border hover:bg-rm-gray-light/50">
              <td className="px-3 py-1.5 text-left font-medium text-rm-dark">{t.departureDate}</td>
              <td className="px-3 py-1.5 text-left text-rm-gray">{t.market}</td>
              <td className="px-3 py-1.5 text-left text-rm-gray">{CABIN_LABELS[t.modelCabin] ?? t.modelCabin}</td>
              <td className="bg-rm-bg px-3 py-1.5 text-rm-gray">{formatNumber(t.pyUnitsSold)}</td>
              <td className="bg-rm-bg px-3 py-1.5 text-rm-gray">{formatLf(t.pyLf)}</td>
              <td className="bg-rm-bg px-3 py-1.5 text-rm-gray">{formatCurrency(t.pyYield)}</td>
              <td className="bg-rm-bg px-3 py-1.5 text-rm-gray">{formatCurrency(t.pyRevenue)}</td>
              <td className="bg-rm-bg px-3 py-1.5 text-left">
                <GapFillBadge method={t.pyGapFill} />
              </td>
              <td className="px-3 py-1.5 text-rm-dark">{formatNumber(t.targetUnits)}</td>
              <td className="px-3 py-1.5 text-rm-dark">{formatLf(t.targetLf)}</td>
              <td className="px-3 py-1.5 text-rm-dark">{formatCurrency(t.targetYield)}</td>
              <td className="px-3 py-1.5 font-medium text-rm-dark">{formatCurrency(t.targetRevenue)}</td>
              <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(t.targetRau)}</td>
              <td className="px-3 py-1.5 text-left text-rm-gray">{t.startRbd}</td>
              <td className="px-3 py-1.5 text-left">
                <ProfileBadge profile={t.profile} />
              </td>
              <td className="px-3 py-1.5 text-left">
                <BindingBadge binding={t.targetBinding} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
