/*
 * NewSeason — wizard om een nieuw seizoen aan te maken in 3 stappen:
 *   0. Naam + datumrange → "Zoek routes"
 *   1. Routes selecteren (data uit useDiscoverRoutes)
 *   2. Pipeline draaien (useRunPipeline) → samenvatting → door naar Overview
 */
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import {
  useDiscoverRoutes,
  useRunPipeline,
  useSeasonalProducts,
  useSeasonalSessions,
} from '@/hooks/useSeasonal'
import { useActiveSession } from '@/hooks/useActiveSession'
import type {
  DiscoverResponse,
  PipelineSummary,
  ProfileAssignment,
  ProfileName,
  SeasonalProduct,
  SeasonalSession,
} from '@/types/seasonal'
import { cabinLabel } from '@/config/displacement'
import { PROFILE_COLORS } from '@/config/seasonal'
import { formatCurrency, formatNumber } from '@/utils/format'
import { ProgressSteps } from '@/components/seasonal/ProgressSteps'
import { SectionCard } from '@/components/ui/SectionCard'
import { KpiCard } from '@/components/displacement/KpiCard'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui/StateViews'

const STEPS = ['Season', 'Routes', 'Profiles', 'Pipeline']

const PROFILES: ProfileName[] = ['High', 'Med', 'Low']

/** Eén uniek vertrek (datum + richting + trein). */
interface Departure {
  key: string
  date: string
  market: string
  train: string
}

function departureKey(date: string, market: string, train: string): string {
  return `${date}|${market}|${train}`
}

/** Unieke vertrekken uit de producten, gesorteerd op datum (dan trein). */
function deriveDepartures(products: SeasonalProduct[]): Departure[] {
  const map = new Map<string, Departure>()
  for (const p of products) {
    const train = String(p.trainNumber)
    const key = departureKey(p.date, p.market, train)
    if (!map.has(key)) map.set(key, { key, date: p.date, market: p.market, train })
  }
  return [...map.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.train.localeCompare(b.train),
  )
}

const DOW_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

function dow(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return Number.isNaN(d.getTime()) ? '' : DOW_NL[d.getDay()]
}

function monthLabel(date: string): string {
  const d = new Date(`${date}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(d)
}

export function NewSeason() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setActiveSession, clearActiveSession } = useActiveSession()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  // Pas zoeken zodra de gebruiker op "Zoek routes" klikt (niet bij elke toets).
  const [search, setSearch] = useState<{ start: string; end: string } | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  // Profiel per vertrek-key; ontbrekend = 'Med' (default).
  const [profiles, setProfiles] = useState<Record<string, ProfileName>>({})

  const discover = useDiscoverRoutes(search?.start ?? '', search?.end ?? '')
  const products = useSeasonalProducts(
    selected,
    search?.start ?? '',
    search?.end ?? '',
    step >= 2,
  )
  const runPipeline = useRunPipeline()

  const departures = useMemo(
    () => deriveDepartures(products.data?.products ?? []),
    [products.data],
  )

  const canSearch = name.trim() !== '' && start !== '' && end !== '' && start <= end

  function onSearch() {
    setSearch({ start, end })
    setSelected([])
    setProfiles({})
    setStep(1)
  }

  function toggleRoute(route: string) {
    setSelected((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route],
    )
  }

  function profileOf(dep: Departure): ProfileName {
    return profiles[dep.key] ?? 'Med'
  }

  function onRun() {
    if (!search) return
    const profileAssignments: ProfileAssignment[] = departures.map((d) => ({
      date: d.date,
      market: d.market,
      profile: profileOf(d),
    }))
    // DEBUG: controleer of de toegekende profielen (bijv. "Low") correct in de
    // assignments zitten vlak voor de pipeline-mutation.
    console.log('Profile assignments:', JSON.stringify(profileAssignments))
    runPipeline.mutate(
      {
        name: name.trim(),
        routes: selected,
        start: search.start,
        end: search.end,
        profileAssignments,
      },
      {
        onSuccess: () => {
          // Een nieuwe run wordt /results/latest. De pipeline-respons bevat geen
          // session-id, dus we wissen de active-session → pagina's vallen terug op
          // latest (= deze run) i.p.v. een eerder geladen seizoen.
          clearActiveSession()
          void queryClient.invalidateQueries({ queryKey: ['seasonal', 'results'] })
        },
      },
    )
  }

  // Open een bestaand seizoen: persisteer de active-session (overleeft sidebar-
  // navigatie) en zet ?session=<id> zodat de pagina's die sessie tonen.
  function loadSeason(sessionId: number) {
    setActiveSession(sessionId)
    void queryClient.invalidateQueries({ queryKey: ['seasonal', 'results'] })
    navigate(`/season/overview?session=${sessionId}`)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-3">
        <h1 className="font-display font-bold text-xl text-rm-dark">New season</h1>
        <ProgressSteps steps={STEPS} current={step} />
      </header>

      {step === 0 && <LoadExistingSeason onLoad={loadSeason} />}

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
        <StepProfiles
          products={products}
          departures={departures}
          profiles={profiles}
          onSetProfiles={setProfiles}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepPipeline
          name={name}
          start={search?.start ?? start}
          end={search?.end ?? end}
          selected={selected}
          status={runPipeline.status}
          summary={runPipeline.data?.summary}
          error={runPipeline.error}
          onBack={() => setStep(2)}
          onRun={onRun}
          onGoOverview={() => navigate('/season/overview')}
        />
      )}
    </div>
  )
}

/* ── Load Existing Season ───────────────────────────────────────────────── */

function LoadExistingSeason({ onLoad }: { onLoad: (sessionId: number) => void }) {
  const sessions = useSeasonalSessions()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Backend (Flask) kan offline zijn — toon dan een subtiele melding i.p.v. fout.
  let body: ReactNode
  if (sessions.isPending) {
    body = <span className="font-body text-xs text-rm-gray">Loading…</span>
  } else if (sessions.isError || sessions.data.length === 0) {
    body = (
      <span className="font-body text-xs text-rm-gray">No existing seasons found.</span>
    )
  } else {
    // Alleen sessies met een numeriek id zijn laadbaar (/sessions/{id}).
    const loadable = sessions.data.filter(
      (s): s is SeasonalSession & { id: number } => typeof s.id === 'number',
    )
    const effectiveId =
      selectedId !== null && loadable.some((s) => s.id === selectedId)
        ? selectedId
        : (loadable[0]?.id ?? null)

    body =
      loadable.length === 0 ? (
        <span className="font-body text-xs text-rm-gray">
          No loadable seasons found.
        </span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={effectiveId !== null ? String(effectiveId) : ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="max-w-[320px] rounded-md border border-rm-border bg-rm-surface px-3 py-2 font-body text-sm text-rm-dark focus:border-es-blue focus:outline-none"
          >
            {loadable.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
                {s.modified ? ` · ${s.modified}` : ''}
              </option>
            ))}
          </select>
          <PrimaryButton
            onClick={() => effectiveId !== null && onLoad(effectiveId)}
            disabled={effectiveId === null}
          >
            Load season
          </PrimaryButton>
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

/* ── Stap 2: profielen toekennen ────────────────────────────────────────── */

function StepProfiles({
  products,
  departures,
  profiles,
  onSetProfiles,
  onBack,
  onNext,
}: {
  products: ReturnType<typeof useSeasonalProducts>
  departures: Departure[]
  profiles: Record<string, ProfileName>
  onSetProfiles: (updater: (prev: Record<string, ProfileName>) => Record<string, ProfileName>) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <SectionCard
      title="Assign profiles"
      subtitle="Set a demand profile per departure (default: Med)"
    >
      <ProfileBody
        products={products}
        departures={departures}
        profiles={profiles}
        onSetProfiles={onSetProfiles}
      />
      <div className="mt-4 flex justify-between">
        <SecondaryButton onClick={onBack}>Back</SecondaryButton>
        <PrimaryButton onClick={onNext} disabled={departures.length === 0}>
          Next
        </PrimaryButton>
      </div>
    </SectionCard>
  )
}

function ProfileBody({
  products,
  departures,
  profiles,
  onSetProfiles,
}: {
  products: ReturnType<typeof useSeasonalProducts>
  departures: Departure[]
  profiles: Record<string, ProfileName>
  onSetProfiles: (updater: (prev: Record<string, ProfileName>) => Record<string, ProfileName>) => void
}) {
  const [bulkFrom, setBulkFrom] = useState('')
  const [bulkTo, setBulkTo] = useState('')
  const [bulkProfile, setBulkProfile] = useState<ProfileName>('Med')
  const [importMsg, setImportMsg] = useState('')

  if (products.isPending) return <LoadingState label="Loading departures…" />
  if (products.isError) {
    return <ErrorState title="Could not load seasonal data" message={products.error.message} />
  }
  if (departures.length === 0) {
    return <EmptyState message="No departures found for this selection." />
  }

  function setOne(key: string, profile: ProfileName) {
    onSetProfiles((prev) => ({ ...prev, [key]: profile }))
  }

  function applyBulk() {
    onSetProfiles((prev) => {
      const next = { ...prev }
      for (const d of departures) {
        if (bulkFrom !== '' && d.date < bulkFrom) continue
        if (bulkTo !== '' && d.date > bulkTo) continue
        next[d.key] = bulkProfile
      }
      return next
    })
  }

  async function handleImport(file: File) {
    setImportMsg('')
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      if (!sheet) return
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      const byTrainDate = new Map<string, string>()
      for (const d of departures) byTrainDate.set(`${d.train}|${d.date}`, d.key)

      const updates: Record<string, ProfileName> = {}
      let applied = 0
      for (const r of rows) {
        const train = pickField(r, ['Treinnummer', 'TrainNumber', 'Train', 'Trein'])
        const dateRaw = pickField(r, ['Datum', 'Date'])
        const profRaw = pickField(r, ['Verwachting', 'Profile', 'Profiel'])
        if (train === undefined || dateRaw === undefined || profRaw === undefined) continue
        const profile = normalizeProfile(profRaw)
        if (!profile) continue
        const key = byTrainDate.get(`${String(train).trim()}|${normalizeDate(dateRaw)}`)
        if (key) {
          updates[key] = profile
          applied += 1
        }
      }
      if (applied > 0) onSetProfiles((prev) => ({ ...prev, ...updates }))
      setImportMsg(`Imported ${applied} assignment(s).`)
    } catch {
      setImportMsg('Could not read the Excel file.')
    }
  }

  // Groepeer op maand voor leesbaarheid.
  const groups = new Map<string, Departure[]>()
  for (const d of departures) {
    const m = d.date.slice(0, 7)
    const list = groups.get(m) ?? []
    list.push(d)
    groups.set(m, list)
  }
  const months = [...groups.keys()].sort()

  return (
    <div className="space-y-4">
      {/* Bulk + import */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-rm-border bg-rm-bg p-3">
        <BulkField label="From">
          <input
            type="date"
            value={bulkFrom}
            onChange={(e) => setBulkFrom(e.target.value)}
            className="rounded-md border border-rm-border bg-rm-surface px-2 py-1 font-body text-[13px] text-rm-dark focus:border-es-blue focus:outline-none"
          />
        </BulkField>
        <BulkField label="To">
          <input
            type="date"
            value={bulkTo}
            onChange={(e) => setBulkTo(e.target.value)}
            className="rounded-md border border-rm-border bg-rm-surface px-2 py-1 font-body text-[13px] text-rm-dark focus:border-es-blue focus:outline-none"
          />
        </BulkField>
        <BulkField label="Profile">
          <ProfileSelect value={bulkProfile} onChange={setBulkProfile} />
        </BulkField>
        <PrimaryButton onClick={applyBulk}>Apply</PrimaryButton>

        <label className="ml-auto cursor-pointer rounded-md border border-rm-border px-4 py-2 font-display text-sm font-medium text-rm-gray hover:bg-rm-gray-light">
          Import Excel
          <input
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImport(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {importMsg && <p className="font-body text-xs text-rm-gray">{importMsg}</p>}

      {/* Tabel per maand */}
      <div className="overflow-x-auto rounded-lg border border-rm-border">
        <table className="w-full border-collapse font-body text-[13px]">
          <thead>
            <tr className="bg-rm-gray-light text-rm-dark">
              <th className="px-3 py-2 text-left font-display font-semibold">Date</th>
              <th className="px-3 py-2 text-left font-display font-semibold">DOW</th>
              <th className="px-3 py-2 text-left font-display font-semibold">Train</th>
              <th className="px-3 py-2 text-left font-display font-semibold">Direction</th>
              <th className="px-3 py-2 text-left font-display font-semibold">Profile</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <ProfileMonthGroup
                key={m}
                month={m}
                departures={groups.get(m)!}
                profiles={profiles}
                onSet={setOne}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProfileMonthGroup({
  month,
  departures,
  profiles,
  onSet,
}: {
  month: string
  departures: Departure[]
  profiles: Record<string, ProfileName>
  onSet: (key: string, profile: ProfileName) => void
}) {
  return (
    <>
      <tr className="border-t border-rm-border bg-rm-bg">
        <td colSpan={5} className="px-3 py-1.5 font-display text-[11px] uppercase tracking-wide text-rm-gray">
          {monthLabel(month)}
        </td>
      </tr>
      {departures.map((d) => (
        <tr key={d.key} className="border-t border-rm-border hover:bg-rm-gray-light/50">
          <td className="px-3 py-1.5 font-medium text-rm-dark">{d.date}</td>
          <td className="px-3 py-1.5 text-rm-gray">{dow(d.date)}</td>
          <td className="px-3 py-1.5 text-rm-gray">{d.train}</td>
          <td className="px-3 py-1.5 text-rm-gray">{d.market}</td>
          <td className="px-3 py-1.5">
            <ProfileSelect
              value={profiles[d.key] ?? 'Med'}
              onChange={(p) => onSet(d.key, p)}
            />
          </td>
        </tr>
      ))}
    </>
  )
}

function ProfileSelect({
  value,
  onChange,
}: {
  value: ProfileName
  onChange: (p: ProfileName) => void
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {/* Kleur uit PROFILE_COLORS (config) — datagestuurd, daarom inline. */}
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: PROFILE_COLORS[value] }}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProfileName)}
        className="rounded-md border border-rm-border bg-rm-surface px-2 py-1 font-body text-[13px] text-rm-dark focus:border-es-blue focus:outline-none"
      >
        {PROFILES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </span>
  )
}

function BulkField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[11px] uppercase tracking-wide text-rm-gray">
        {label}
      </span>
      {children}
    </label>
  )
}

/** Eerste niet-lege waarde uit een rij voor één van de kandidaat-kolomnamen. */
function pickField(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const v = row[k]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

/** "Hoog"/"Midden"/"Laag" of "High"/"Med"/"Low" → ProfileName. */
function normalizeProfile(raw: unknown): ProfileName | undefined {
  const s = String(raw).trim().toLowerCase()
  if (s === 'hoog' || s === 'high') return 'High'
  if (s === 'midden' || s === 'med' || s === 'medium' || s === 'mid') return 'Med'
  if (s === 'laag' || s === 'low') return 'Low'
  return undefined
}

/** Normaliseer Excel-datum (Date, serial-Date, of string) naar YYYY-MM-DD. */
function normalizeDate(raw: unknown): string {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getFullYear()
    const m = String(raw.getMonth() + 1).padStart(2, '0')
    const d = String(raw.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const dm = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dm) return `${dm[3]}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`
  const parsed = new Date(s)
  return Number.isNaN(parsed.getTime()) ? s : normalizeDate(parsed)
}

/* ── Stap 3: pipeline draaien ───────────────────────────────────────────── */

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
