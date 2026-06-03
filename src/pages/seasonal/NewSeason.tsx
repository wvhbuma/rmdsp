/*
 * NewSeason — wizard om een nieuw seizoen aan te maken in 3 stappen:
 *   0. Naam + datumrange → "Zoek routes"
 *   1. Routes selecteren (data uit useDiscoverRoutes)
 *   2. Pipeline draaien (useRunPipeline) → samenvatting → door naar Overview
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useDiscoverRoutes,
  useRunPipeline,
  useSeasonalSessions,
} from '@/hooks/useSeasonal'
import type { DiscoverResponse, PipelineSummary } from '@/types/seasonal'
import { cabinLabel } from '@/config/displacement'
import { formatCurrency, formatNumber } from '@/utils/format'
import { ProgressSteps } from '@/components/seasonal/ProgressSteps'
import { SectionCard } from '@/components/displacement/SectionCard'
import { KpiCard } from '@/components/displacement/KpiCard'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/displacement/StateViews'

const STEPS = ['Season', 'Routes', 'Pipeline']

export function NewSeason() {
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  // Pas zoeken zodra de gebruiker op "Zoek routes" klikt (niet bij elke toets).
  const [search, setSearch] = useState<{ start: string; end: string } | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const discover = useDiscoverRoutes(search?.start ?? '', search?.end ?? '')
  const runPipeline = useRunPipeline()

  const canSearch = name.trim() !== '' && start !== '' && end !== '' && start <= end

  function onSearch() {
    setSearch({ start, end })
    setSelected([])
    setStep(1)
  }

  function toggleRoute(route: string) {
    setSelected((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route],
    )
  }

  function onRun() {
    if (!search) return
    runPipeline.mutate({ name: name.trim(), routes: selected, start: search.start, end: search.end })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-3">
        <h1 className="font-display font-bold text-xl text-rm-dark">New season</h1>
        <ProgressSteps steps={STEPS} current={step} />
      </header>

      {step === 0 && (
        <LoadExistingSeason onLoad={() => navigate('/season/overview')} />
      )}

      {step === 0 && (
        <StepSeason
          name={name}
          start={start}
          end={end}
          canSearch={canSearch}
          onName={setName}
          onStart={setStart}
          onEnd={setEnd}
          onSearch={onSearch}
        />
      )}

      {step === 1 && (
        <StepRoutes
          discover={discover}
          selected={selected}
          onToggle={toggleRoute}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepPipeline
          name={name}
          start={search?.start ?? start}
          end={search?.end ?? end}
          selected={selected}
          status={runPipeline.status}
          summary={runPipeline.data?.summary}
          error={runPipeline.error}
          onBack={() => setStep(1)}
          onRun={onRun}
          onGoOverview={() => navigate('/season/overview')}
        />
      )}
    </div>
  )
}

/* ── Load Existing Season ───────────────────────────────────────────────── */

function LoadExistingSeason({ onLoad }: { onLoad: (session: string) => void }) {
  const sessions = useSeasonalSessions()
  const [selected, setSelected] = useState('')

  // Backend (Flask) kan offline zijn — toon dan een subtiele melding i.p.v. fout.
  let body: ReactNode
  if (sessions.isPending) {
    body = <span className="font-body text-xs text-rm-gray">Loading…</span>
  } else if (sessions.isError || sessions.data.length === 0) {
    body = (
      <span className="font-body text-xs text-rm-gray">No existing seasons found.</span>
    )
  } else {
    const effective = sessions.data.some((s) => s.name === selected)
      ? selected
      : sessions.data[0].name
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={effective}
          onChange={(e) => setSelected(e.target.value)}
          className="max-w-[320px] rounded-md border border-rm-border bg-rm-surface px-3 py-2 font-body text-sm text-rm-dark focus:border-es-blue focus:outline-none"
        >
          {sessions.data.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
              {s.modified ? ` · ${s.modified}` : ''}
            </option>
          ))}
        </select>
        <PrimaryButton onClick={() => onLoad(effective)}>Load season</PrimaryButton>
      </div>
    )
  }

  return (
    <SectionCard title="Load existing season" subtitle="Open a previously computed season">
      {body}
    </SectionCard>
  )
}

/* ── Stap 0: seizoen-config ─────────────────────────────────────────────── */

function StepSeason({
  name,
  start,
  end,
  canSearch,
  onName,
  onStart,
  onEnd,
  onSearch,
}: {
  name: string
  start: string
  end: string
  canSearch: boolean
  onName: (v: string) => void
  onStart: (v: string) => void
  onEnd: (v: string) => void
  onSearch: () => void
}) {
  return (
    <SectionCard title="Season" subtitle="Name and period to discover routes for">
      <div className="space-y-4">
        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="e.g. Winter 2026/27"
            className="w-full rounded-md border border-rm-border bg-rm-surface px-3 py-2 font-body text-sm text-rm-dark focus:border-es-blue focus:outline-none"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Start date">
            <DateInput value={start} onChange={onStart} />
          </Field>
          <Field label="End date">
            <DateInput value={end} onChange={onEnd} />
          </Field>
        </div>
        {start !== '' && end !== '' && start > end && (
          <p className="font-body text-xs text-villain">
            End date must be after the start date.
          </p>
        )}
        <div className="flex justify-end">
          <PrimaryButton onClick={onSearch} disabled={!canSearch}>
            Find routes
          </PrimaryButton>
        </div>
      </div>
    </SectionCard>
  )
}

/* ── Stap 1: routes selecteren ──────────────────────────────────────────── */

function StepRoutes({
  discover,
  selected,
  onToggle,
  onBack,
  onNext,
}: {
  discover: ReturnType<typeof useDiscoverRoutes>
  selected: string[]
  onToggle: (route: string) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <SectionCard
      title="Routes"
      subtitle="Select the routes you want to plan for this season"
    >
      <RouteList discover={discover} selected={selected} onToggle={onToggle} />
      <div className="mt-4 flex justify-between">
        <SecondaryButton onClick={onBack}>Back</SecondaryButton>
        <PrimaryButton onClick={onNext} disabled={selected.length === 0}>
          Next ({selected.length})
        </PrimaryButton>
      </div>
    </SectionCard>
  )
}

function RouteList({
  discover,
  selected,
  onToggle,
}: {
  discover: ReturnType<typeof useDiscoverRoutes>
  selected: string[]
  onToggle: (route: string) => void
}) {
  if (discover.isPending) return <LoadingState label="Discovering routes…" />
  if (discover.isError) {
    return <ErrorState title="Could not load seasonal data" message={discover.error.message} />
  }

  const entries = Object.entries(discover.data.routes)
  if (entries.length === 0) {
    return <EmptyState message="No routes found for this period." />
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {entries.map(([route, info]) => (
        <RouteCard
          key={route}
          route={route}
          info={info}
          checked={selected.includes(route)}
          onToggle={() => onToggle(route)}
        />
      ))}
    </div>
  )
}

function RouteCard({
  route,
  info,
  checked,
  onToggle,
}: {
  route: string
  info: DiscoverResponse['routes'][string]
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`rounded-lg border p-3 text-left transition-colors ${
        checked ? 'border-es-blue bg-es-blue/5' : 'border-rm-border hover:bg-rm-gray-light'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold text-sm text-rm-dark">{route}</span>
        <span
          className={`flex h-4 w-4 items-center justify-center rounded border ${
            checked ? 'border-es-blue bg-es-blue text-white' : 'border-rm-border'
          }`}
        >
          {checked && <span className="text-[10px]">✓</span>}
        </span>
      </div>
      <div className="mt-0.5 font-body text-xs text-rm-gray">
        {info.totalProducts} products · {info.minDate} – {info.maxDate}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {info.cabins.map((c) => (
          <span
            key={c.code}
            className="rounded bg-rm-gray-light px-1.5 py-0.5 font-body text-[11px] text-rm-dark"
            title={`${c.products} products · avg capacity ${formatNumber(c.avgCapacity)}`}
          >
            {cabinLabel(c.code)} · {c.products}p · {formatNumber(c.avgCapacity)} cap
          </span>
        ))}
      </div>
    </button>
  )
}

/* ── Stap 2: pipeline draaien ───────────────────────────────────────────── */

function StepPipeline({
  name,
  start,
  end,
  selected,
  status,
  summary,
  error,
  onBack,
  onRun,
  onGoOverview,
}: {
  name: string
  start: string
  end: string
  selected: string[]
  status: 'idle' | 'pending' | 'success' | 'error'
  summary: PipelineSummary | undefined
  error: Error | null
  onBack: () => void
  onRun: () => void
  onGoOverview: () => void
}) {
  return (
    <SectionCard
      title="Pipeline"
      subtitle="Calculate targets for the selected routes"
    >
      <dl className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Recap label="Name" value={name} />
        <Recap label="Period" value={`${start} – ${end}`} />
        <Recap label="Routes" value={selected.join(', ') || '—'} />
      </dl>

      {status === 'pending' && <LoadingState label="Pipeline running…" />}
      {status === 'error' && (
        <ErrorState
          title="Pipeline failed"
          message={error?.message ?? 'Pipeline failed.'}
        />
      )}
      {status === 'success' && summary && <PipelineSummaryCard summary={summary} />}

      <div className="mt-4 flex justify-between">
        <SecondaryButton onClick={onBack} disabled={status === 'pending'}>
          Back
        </SecondaryButton>
        {status === 'success' ? (
          <PrimaryButton onClick={onGoOverview}>To Season Overview →</PrimaryButton>
        ) : (
          <PrimaryButton onClick={onRun} disabled={status === 'pending' || selected.length === 0}>
            Run Pipeline
          </PrimaryButton>
        )}
      </div>
    </SectionCard>
  )
}

function PipelineSummaryCard({ summary }: { summary: PipelineSummary }) {
  const t = summary.targets
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-status-ok/30 bg-status-ok/5 px-3 py-2 font-body text-sm text-rm-dark">
        Pipeline complete — step: <span className="font-medium">{summary.step}</span>
      </div>
      {t && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Targets" value={formatNumber(t.count)} />
          <KpiCard label="Units" value={formatNumber(t.totalUnits)} />
          <KpiCard
            label="Revenue"
            value={formatCurrency(t.totalRevenue)}
            accent="blue"
          />
          <KpiCard label="Avg LF" value={`${Math.round(t.avgLf * 100)}%`} />
        </div>
      )}
      {summary.products && (
        <p className="font-body text-xs text-rm-gray">
          {summary.products.count} products · {summary.products.routes.join(', ')} ·{' '}
          {summary.products.dates}
        </p>
      )}
    </div>
  )
}

/* ── Kleine herbruikbare bouwstenen ─────────────────────────────────────── */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[11px] uppercase tracking-wide text-rm-gray">
        {label}
      </span>
      {children}
    </label>
  )
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-rm-border bg-rm-surface px-3 py-2 font-body text-sm text-rm-dark focus:border-es-blue focus:outline-none"
    />
  )
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-rm-border bg-rm-bg px-3 py-2">
      <dt className="font-display text-[10px] uppercase tracking-wide text-rm-gray">
        {label}
      </dt>
      <dd className="font-body text-sm text-rm-dark">{value}</dd>
    </div>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-es-blue px-4 py-2 font-display text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-rm-border px-4 py-2 font-display text-sm font-medium text-rm-gray transition-colors hover:bg-rm-gray-light disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
