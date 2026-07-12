/*
 * SeasonSettings — configuratie per bestemming (yield-multiplier, elasticiteiten
 * per maand, constraints, zone/sharing discounts). Inline editable; export naar
 * JSON en reset naar defaults.
 *
 * Defaults zijn voorlopig hardcoded (later via useSeasonalConfig). Types komen
 * uit @/types/seasonal.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { DestinationConfig, SeasonalConfig } from '@/types/seasonal'
import { CABIN_LABELS, CABIN_ORDER } from '@/config/seasonal'
import { ROUTE_CONFIG } from '@/config/routes'
import {
  useRunPipeline,
  useSaveConfig,
  useSeasonalConfig,
  useSeasonalResults,
} from '@/hooks/useSeasonal'
import { DestinationTabs } from '@/components/seasonal/DestinationTabs'
import { NumberInput } from '@/components/seasonal/NumberInput'
import { SelectFilter } from '@/components/seasonal/SelectFilter'
import { ConfirmDialog } from '@/components/seasonal/ConfirmDialog'
import { SectionCard } from '@/components/displacement/SectionCard'

const ELASTICITY_MONTHS = ['Nov', 'Dec', 'Jan']

function makeElasticities(): DestinationConfig['elasticities'] {
  // Prijselasticiteiten zijn negatief (vraag daalt bij prijsstijging).
  return {
    Nov: { SEA: -1.4, CHT: -1.1, CMF: -0.9, SLP: -0.7 },
    Dec: { SEA: -1.6, CHT: -1.3, CMF: -1.0, SLP: -0.8 },
    Jan: { SEA: -1.2, CHT: -1.0, CMF: -0.8, SLP: -0.6 },
  }
}

function makeDestination(market: string, yieldMultiplier: number): DestinationConfig {
  return {
    routes: ROUTE_CONFIG[market]?.directions ?? [],
    yieldMultiplier,
    elasticities: makeElasticities(),
    constraints: {
      targetLfCeiling: 0.95,
      maxYieldDecline: 0.15,
      highLfThreshold: 0.9,
      highLfYieldBonus: 0.1,
    },
    zoneDiscounts: { SEA: 1.0, CHT: 0.95, CMF: 0.9, SLP: 0.85 },
  }
}

const DEFAULT_CONFIG: SeasonalConfig = {
  destinations: {
    Milan: makeDestination('Milan', 1.2),
    Prague: makeDestination('Prague', 1.0),
    Paris: makeDestination('Paris', 1.0),
  },
}

function clone(config: SeasonalConfig): SeasonalConfig {
  return JSON.parse(JSON.stringify(config)) as SeasonalConfig
}

interface Meaning {
  label: string
  cls: string
}

function elasticityMeaning(e: number): Meaning {
  // Betekenis op de magnitude (elasticiteit is negatief).
  const a = Math.abs(e)
  if (a < 0.5) return { label: 'Very inelastic', cls: 'text-lf-green' }
  if (a < 0.8) return { label: 'Inelastic', cls: 'text-lf-green' }
  if (a < 1.2) return { label: 'Average', cls: 'text-rm-gray' }
  if (a < 1.8) return { label: 'Elastic', cls: 'text-lf-orange' }
  return { label: 'Very elastic', cls: 'text-villain' }
}

const CONSTRAINT_FIELDS: {
  key: keyof DestinationConfig['constraints']
  label: string
  step: number
}[] = [
  { key: 'targetLfCeiling', label: 'LF Ceiling', step: 0.01 },
  { key: 'maxYieldDecline', label: 'Max Yield Decline', step: 0.01 },
  { key: 'highLfThreshold', label: 'High-LF Threshold', step: 0.01 },
  { key: 'highLfYieldBonus', label: 'High-LF Yield Bonus', step: 0.01 },
]

export function SeasonSettings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const results = useSeasonalResults()
  const runPipeline = useRunPipeline()
  const saveConfigMutation = useSaveConfig()
  // Config staat los van sessies: primaire bron is GET /api/seasonal/config.
  const configQuery = useSeasonalConfig()
  const session = results.data?._session

  const [config, setConfig] = useState<SeasonalConfig>(() => clone(DEFAULT_CONFIG))
  const destinations = Object.keys(config.destinations)
  const [activeDest, setActiveDest] = useState<string>(destinations[0] ?? '')
  const [month, setMonth] = useState<string>(ELASTICITY_MONTHS[0])
  const [confirmRerun, setConfirmRerun] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')
  // Snapshot van de laatst op de server opgeslagen config (JSON), om "dirty" te
  // bepalen. Initieel = de defaults (== beginstate van editConfig).
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    JSON.stringify(DEFAULT_CONFIG),
  )
  const [savedFlash, setSavedFlash] = useState(false)
  const flashTimer = useRef<number | null>(null)
  // Voorkomt dat de server-config de hardcoded defaults — of een handmatig
  // geladen bestand — overschrijft nadat hij eenmaal is toegepast.
  const configApplied = useRef(false)

  const dirty = JSON.stringify(config) !== savedSnapshot

  useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    },
    [],
  )

  function handleSave() {
    saveConfigMutation.mutate(config, {
      onSuccess: () => {
        setSavedSnapshot(JSON.stringify(config))
        setLoadMsg('Config saved')
        setSavedFlash(true)
        if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
        flashTimer.current = window.setTimeout(() => setSavedFlash(false), 2000)
        void queryClient.invalidateQueries({ queryKey: ['seasonal', 'config'] })
      },
    })
  }

  // Auto-load: gebruik de server-config (GET /api/seasonal/config) als default
  // zodra die binnenkomt. Alleen het destinations-formaat (van Export/Load
  // Config) mag overschrijven; leeg/error/ander formaat → hardcoded defaults.
  useEffect(() => {
    if (configApplied.current) return
    const cfg = configQuery.data
    if (!cfg) return // nog aan het laden (of error) → wachten
    configApplied.current = true
    if (typeof cfg !== 'object' || !cfg.destinations || typeof cfg.destinations !== 'object') {
      return // leeg of ongeldig formaat → val terug op hardcoded defaults
    }
    const loaded = clone(cfg)
    setConfig(loaded)
    // De server-config is de huidige opgeslagen versie → snapshot bijwerken.
    setSavedSnapshot(JSON.stringify(loaded))
    const keys = Object.keys(loaded.destinations)
    setActiveDest((prev) => (keys.includes(prev) ? prev : (keys[0] ?? prev)))
    setLoadMsg('Config loaded')
  }, [configQuery.data])

  const dest = config.destinations[activeDest]

  function reRunWithSettings() {
    if (!session) return
    console.log('Re-run config:', config)
    // Sla de config ook op (los van de run); de server leest 'm van disk.
    saveConfigMutation.mutate(config, {
      onSuccess: () => {
        setSavedSnapshot(JSON.stringify(config))
        void queryClient.invalidateQueries({ queryKey: ['seasonal', 'config'] })
      },
    })
    runPipeline.mutate(
      {
        name: session.name,
        routes: session.routes,
        start: session.seasonStart,
        end: session.seasonEnd,
        config,
      },
      {
        onSuccess: () => {
          setConfirmRerun(false)
          void queryClient.invalidateQueries({ queryKey: ['seasonal', 'results'] })
          navigate('/season/overview')
        },
      },
    )
  }

  function updateActive(updater: (d: DestinationConfig) => DestinationConfig) {
    setConfig((prev) => ({
      ...prev,
      destinations: {
        ...prev.destinations,
        [activeDest]: updater(prev.destinations[activeDest]),
      },
    }))
  }

  function exportConfig() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seasonal-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function loadConfig(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as SeasonalConfig
        if (parsed && typeof parsed === 'object' && parsed.destinations) {
          // Een handmatig geladen bestand wint van de server-config.
          configApplied.current = true
          setConfig(parsed)
          const keys = Object.keys(parsed.destinations)
          if (keys.length > 0 && !keys.includes(activeDest)) setActiveDest(keys[0])
          setLoadMsg(`Config loaded from ${file.name}`)
        } else {
          setLoadMsg('Invalid config file.')
        }
      } catch {
        setLoadMsg('Could not read the config file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl text-rm-dark">Settings</h1>
          <p className="font-body text-sm text-rm-gray">
            Configuration per destination. Changes stay local until you export.
          </p>
          {loadMsg && (
            <p className="mt-0.5 font-body text-xs text-es-blue">{loadMsg}</p>
          )}
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer rounded-md border border-rm-border px-4 py-2 font-display text-sm font-medium text-rm-gray hover:bg-rm-gray-light">
            Load config
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) loadConfig(file)
                e.target.value = ''
              }}
            />
          </label>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saveConfigMutation.isPending}
            className="rounded-md border border-es-blue px-4 py-2 font-display text-sm font-medium text-es-blue hover:bg-es-blue/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveConfigMutation.isPending
              ? 'Saving…'
              : savedFlash
                ? 'Saved ✓'
                : 'Save config'}
          </button>
          <button
            type="button"
            onClick={exportConfig}
            className="rounded-md bg-es-blue px-4 py-2 font-display text-sm font-medium text-white hover:opacity-90"
          >
            Export config
          </button>
          <button
            type="button"
            onClick={() => setConfirmRerun(true)}
            disabled={!session || runPipeline.isPending}
            title={session ? undefined : 'No session info available'}
            className="rounded-md border border-es-blue px-4 py-2 font-display text-sm font-medium text-es-blue hover:bg-es-blue/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {runPipeline.isPending ? 'Re-running…' : 'Re-run with these settings'}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfig(clone(DEFAULT_CONFIG))
              setLoadMsg('')
            }}
            className="rounded-md border border-rm-border px-4 py-2 font-display text-sm font-medium text-rm-gray hover:bg-rm-gray-light"
          >
            Reset
          </button>
        </div>
      </header>

      <DestinationTabs destinations={destinations} active={activeDest} onSelect={setActiveDest} />

      {dest && (
        <>
          <SectionCard title="Yield multiplier">
            <div className="flex items-center gap-3">
              <NumberInput
                value={dest.yieldMultiplier}
                step={0.05}
                min={0}
                onChange={(v) => updateActive((d) => ({ ...d, yieldMultiplier: v }))}
              />
              <span className="font-body text-xs text-rm-gray">
                Routes: {dest.routes.join(', ') || '—'}
              </span>
            </div>
          </SectionCard>

          <SectionCard
            title="Elasticities"
            subtitle="Price elasticity (ε) per cabin"
            actions={
              <SelectFilter label="Month" value={month} onChange={setMonth}>
                {ELASTICITY_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </SelectFilter>
            }
          >
            <table className="w-full border-collapse text-left font-body text-[13px]">
              <thead>
                <tr className="bg-rm-gray-light text-rm-dark">
                  <th className="px-3 py-2 font-display font-semibold">Cabin</th>
                  <th className="px-3 py-2 font-display font-semibold">ε</th>
                  <th className="px-3 py-2 font-display font-semibold">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {CABIN_ORDER.map((c) => {
                  const value = dest.elasticities[month]?.[c] ?? 0
                  const meaning = elasticityMeaning(value)
                  return (
                    <tr key={c} className="border-t border-rm-border">
                      <td className="px-3 py-1.5 font-medium text-rm-dark">{CABIN_LABELS[c]}</td>
                      <td className="px-3 py-1.5">
                        <NumberInput
                          value={value}
                          step={0.1}
                          onChange={(v) =>
                            updateActive((d) => ({
                              ...d,
                              elasticities: {
                                ...d.elasticities,
                                [month]: { ...d.elasticities[month], [c]: v },
                              },
                            }))
                          }
                        />
                      </td>
                      <td className={`px-3 py-1.5 font-medium ${meaning.cls}`}>{meaning.label}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard title="Constraints">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CONSTRAINT_FIELDS.map((f) => (
                <div key={f.key} className="rounded-lg border border-rm-border bg-rm-bg p-3">
                  <div className="mb-2 font-display text-[11px] uppercase tracking-wide text-rm-gray">
                    {f.label}
                  </div>
                  <NumberInput
                    value={dest.constraints[f.key]}
                    step={f.step}
                    min={0}
                    onChange={(v) =>
                      updateActive((d) => ({
                        ...d,
                        constraints: { ...d.constraints, [f.key]: v },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Zone / sharing discounts" subtitle="Factor per cabin">
            <table className="w-full border-collapse text-left font-body text-[13px]">
              <thead>
                <tr className="bg-rm-gray-light text-rm-dark">
                  <th className="px-3 py-2 font-display font-semibold">Cabin</th>
                  <th className="px-3 py-2 font-display font-semibold">Factor</th>
                  <th className="px-3 py-2 font-display font-semibold">Discount</th>
                </tr>
              </thead>
              <tbody>
                {CABIN_ORDER.map((c) => {
                  const factor = dest.zoneDiscounts[c]
                  const discountPct = Math.round((1 - factor) * 100)
                  return (
                    <tr key={c} className="border-t border-rm-border">
                      <td className="px-3 py-1.5 font-medium text-rm-dark">{CABIN_LABELS[c]}</td>
                      <td className="px-3 py-1.5">
                        <NumberInput
                          value={factor}
                          step={0.05}
                          min={0}
                          max={1}
                          onChange={(v) =>
                            updateActive((d) => ({
                              ...d,
                              zoneDiscounts: { ...d.zoneDiscounts, [c]: v },
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-1.5 text-rm-gray">{discountPct}% discount</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </SectionCard>
        </>
      )}

      {confirmRerun && session && (
        <ConfirmDialog
          title="Re-run pipeline"
          message={`Re-run pipeline for ${session.name} with these settings?`}
          confirmLabel="Re-run"
          busy={runPipeline.isPending}
          onCancel={() => setConfirmRerun(false)}
          onConfirm={reRunWithSettings}
        />
      )}
    </div>
  )
}
