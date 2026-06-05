/*
 * SeasonImplement — validatie en push van fares naar de RAM API.
 *
 * Filters (route/cabin multi + datumrange) bepalen de selectie; daarvan tonen we
 * tellingen. Dry-run en live-push gaan via useImplement(); live-push vereist een
 * bevestiging. De push-log toont per regel het resultaat.
 *
 * LET OP: live-push schrijft naar productie — vandaar de waarschuwing + dialog.
 */
import { useMemo, useState } from 'react'
import type { ImplementResult, SeasonalResults } from '@/types/seasonal'
import { useImplement, useImplementStatus, useSeasonalResults } from '@/hooks/useSeasonal'
import { CABIN_LABELS, CABIN_ORDER } from '@/config/seasonal'
import { formatNumber } from '@/utils/format'
import { KpiCard } from '@/components/displacement/KpiCard'
import { SectionCard } from '@/components/displacement/SectionCard'
import { Icon } from '@/layout/icons'
import { ErrorState, LoadingState } from '@/components/displacement/StateViews'
import { NoSeasonData } from '@/components/seasonal/NoSeasonData'

export function SeasonImplement() {
  const query = useSeasonalResults()

  if (query.isPending) return <LoadingState label="Loading results…" />
  if (query.isError) {
    return <ErrorState title="Could not load seasonal data" message={query.error.message} />
  }
  if (query.data.targets.length === 0 && query.data.masks.length === 0) {
    return <NoSeasonData message="No results to implement yet." />
  }

  return <ImplementView results={query.data} />
}

interface DateLike {
  market: string
  modelCabin: string
  departureDate: string
}

function ImplementView({ results }: { results: SeasonalResults }) {
  const [routes, setRoutes] = useState<string[]>([])
  const [cabins, setCabins] = useState<string[]>([])
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const implement = useImplement()
  const status = useImplementStatus()
  const keyConfigured = status.data?.keyConfigured === true

  const allRoutes = useMemo(
    () => [...new Set(results.targets.map((t) => t.market))].sort(),
    [results],
  )
  const allCabins = useMemo(
    () => CABIN_ORDER.filter((c) => results.targets.some((t) => t.modelCabin === c)),
    [results],
  )

  const matches = useMemo(() => {
    function predicate(row: DateLike): boolean {
      if (routes.length > 0 && !routes.includes(row.market)) return false
      if (cabins.length > 0 && !cabins.includes(row.modelCabin)) return false
      if (start !== '' && row.departureDate < start) return false
      if (end !== '' && row.departureDate > end) return false
      return true
    }
    return predicate
  }, [routes, cabins, start, end])

  const filteredTargets = useMemo(() => results.targets.filter(matches), [results, matches])
  const filteredMasks = useMemo(() => results.masks.filter(matches), [results, matches])
  const filteredSim = useMemo(() => results.sim.filter(matches), [results, matches])

  const departures = useMemo(
    () => new Set(filteredTargets.map((t) => `${t.market}|${t.departureDate}`)).size,
    [filteredTargets],
  )
  const productCount = useMemo(
    () => new Set(filteredTargets.map((t) => t.productId)).size,
    [filteredTargets],
  )

  const mutationArgs = {
    routes: routes.length > 0 ? routes : undefined,
    cabins: cabins.length > 0 ? cabins : undefined,
  }

  function runDryRun() {
    implement.mutate({ ...mutationArgs, dryRun: true })
  }

  function runLivePush() {
    setShowConfirm(false)
    implement.mutate({ ...mutationArgs, dryRun: false })
  }

  function exportJson() {
    const payload: SeasonalResults = {
      targets: filteredTargets,
      masks: filteredMasks,
      sim: filteredSim,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seasonal-implementation.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const canSubmit = productCount > 0

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-display font-bold text-xl text-rm-dark">Implementation</h1>
        <p className="font-body text-sm text-rm-gray">
          Validate and push the calculated fares to the RAM API.
        </p>
      </header>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-status-warn/40 bg-status-warn/10 px-4 py-3">
        <Icon name="alert-triangle" className="mt-0.5 h-5 w-5 shrink-0 text-status-warn" />
        <p className="font-body text-sm text-rm-dark">
          <span className="font-semibold">Warning:</span> a live push writes directly to
          the RAM production API. The API key is handled server-side; run a dry-run first.
        </p>
      </div>

      {/* Filters */}
      <SectionCard title="Selection">
        <div className="space-y-4">
          <ChipRow
            label="Route"
            options={allRoutes}
            selected={routes}
            onToggle={(v) => setRoutes((p) => toggle(p, v))}
          />
          <ChipRow
            label="Cabin"
            options={allCabins}
            render={(c) => CABIN_LABELS[c] ?? c}
            selected={cabins}
            onToggle={(v) => setCabins((p) => toggle(p, v))}
          />
          <div className="flex flex-wrap items-end gap-4">
            <DateField label="From" value={start} onChange={setStart} />
            <DateField label="To" value={end} onChange={setEnd} />
          </div>
        </div>
      </SectionCard>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Departures" value={formatNumber(departures)} />
        <KpiCard label="Fare items" value={formatNumber(filteredMasks.length)} accent="blue" />
        <KpiCard label="Target items" value={formatNumber(filteredTargets.length)} />
      </div>

      {/* Actions */}
      <SectionCard title="Actions">
        <div className="space-y-4">
          <p className="font-body text-xs text-rm-gray">
            The RAM API key is read server-side (RAM_API_KEY) — no key is sent from the
            browser.
          </p>

          {!keyConfigured && !status.isPending && (
            <p className="font-body text-xs text-status-warn">
              No API key configured on the server — live push is disabled. Dry runs
              still work.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runDryRun}
              disabled={!canSubmit || implement.isPending}
              className="rounded-md border border-es-blue px-4 py-2 font-display text-sm font-medium text-es-blue transition-colors hover:bg-es-blue/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Dry Run
            </button>
            <button
              type="button"
              onClick={exportJson}
              disabled={productCount === 0}
              className="rounded-md border border-rm-border px-4 py-2 font-display text-sm font-medium text-rm-gray transition-colors hover:bg-rm-gray-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={!canSubmit || implement.isPending || !keyConfigured}
              title={keyConfigured ? undefined : 'API key not configured on server'}
              className="rounded-md bg-villain px-4 py-2 font-display text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              LIVE Push
            </button>
          </div>

          <ResultArea
            pending={implement.isPending}
            error={implement.error}
            result={implement.data}
          />
        </div>
      </SectionCard>

      {showConfirm && (
        <ConfirmDialog
          count={productCount}
          onCancel={() => setShowConfirm(false)}
          onConfirm={runLivePush}
        />
      )}
    </div>
  )
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function ChipRow({
  label,
  options,
  selected,
  onToggle,
  render,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
  render?: (v: string) => string
}) {
  return (
    <div>
      <div className="mb-1.5 font-display text-[11px] uppercase tracking-wide text-rm-gray">
        {label} <span className="normal-case">(empty = all)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`rounded-full border px-3 py-1 font-body text-[13px] transition-colors ${
                active
                  ? 'border-es-blue bg-es-blue text-white'
                  : 'border-rm-border text-rm-gray hover:bg-rm-gray-light'
              }`}
            >
              {render ? render(o) : o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[11px] uppercase tracking-wide text-rm-gray">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-rm-border bg-rm-surface px-3 py-2 font-body text-sm text-rm-dark focus:border-es-blue focus:outline-none"
      />
    </label>
  )
}

function ResultArea({
  pending,
  error,
  result,
}: {
  pending: boolean
  error: Error | null
  result: ImplementResult | undefined
}) {
  if (pending) return <LoadingState label="Working…" />
  if (error) {
    return (
      <div className="rounded-md border border-status-error/30 bg-status-error/5 px-3 py-2 font-body text-sm text-status-error">
        {error.message}
      </div>
    )
  }
  if (!result) return null

  const isDryRun = result.status === 'dry_run'
  const ok = result.status !== 'error'
  return (
    <div className="space-y-2">
      <div
        className={`rounded-md border px-3 py-2 font-body text-sm ${
          ok
            ? 'border-status-ok/30 bg-status-ok/5 text-rm-dark'
            : 'border-status-error/30 bg-status-error/5 text-status-error'
        }`}
      >
        <span className="font-medium">{isDryRun ? 'Dry run' : 'Live push'}:</span>{' '}
        {result.pushed} pushed · {result.skipped} skipped
        {isDryRun && result.products !== undefined && (
          <> · {result.products} products · {result.fareItems ?? 0} fare items</>
        )}
      </div>
      {result.log.length > 0 && <PushLog log={result.log} />}
    </div>
  )
}

function PushLog({ log }: { log: string[] }) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-md border border-rm-border bg-rm-bg p-2 font-mono text-xs">
      {log.map((line, i) => {
        const isError = line.startsWith('❌') || /error|fail/i.test(line)
        return (
          <div
            key={i}
            className={`px-1 py-0.5 ${isError ? 'text-status-error' : 'text-rm-dark'}`}
          >
            {line}
          </div>
        )
      })}
    </div>
  )
}

function ConfirmDialog({
  count,
  onCancel,
  onConfirm,
}: {
  count: number
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rm-dark/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-rm-border bg-rm-surface p-5 shadow-xl">
        <h3 className="font-display font-semibold text-base text-rm-dark">
          Confirm live push
        </h3>
        <p className="mt-2 font-body text-sm text-rm-gray">
          Are you sure you want to push{' '}
          <span className="font-semibold text-rm-dark">{count}</span> products to the{' '}
          <span className="font-semibold text-rm-dark">PRD</span> environment? This cannot
          be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-rm-border px-4 py-2 font-display text-sm font-medium text-rm-gray hover:bg-rm-gray-light"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-villain px-4 py-2 font-display text-sm font-semibold text-white hover:opacity-90"
          >
            Yes, push to PRD
          </button>
        </div>
      </div>
    </div>
  )
}
