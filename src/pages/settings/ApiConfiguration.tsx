/*
 * API Configuration — beheert de RAM/Seasonal API endpoints + de RAM API key.
 * Opgeslagen in localStorage ('ram_api_config') via useApiConfig.
 *
 * De RAM API key wordt hier ingevuld en bij een LIVE push meegestuurd in de
 * request body (Implementation- en Targets-pagina's). Geen server-side env-var
 * meer nodig in deze flow.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useApiConfig, type ApiConfig } from '@/hooks/useApiConfig'

type TestState =
  | { state: 'idle' }
  | { state: 'testing' }
  | { state: 'ok'; message: string }
  | { state: 'error'; message: string }

export function ApiConfiguration() {
  const { config, setConfig } = useApiConfig()
  const [form, setForm] = useState<ApiConfig>(config)
  const [saved, setSaved] = useState(false)
  const [test, setTest] = useState<TestState>({ state: 'idle' })

  function update<K extends keyof ApiConfig>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function save() {
    setConfig({
      ramApiUrl: form.ramApiUrl.trim(),
      ramApiKey: form.ramApiKey,
      seasonalApiUrl: form.seasonalApiUrl.trim(),
    })
    setSaved(true)
  }

  async function testConnection() {
    setTest({ state: 'testing' })
    try {
      const base = form.seasonalApiUrl.trim().replace(/\/$/, '')
      const res = await fetch(`${base}/api/seasonal/sessions`)
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      setTest({ state: 'ok', message: 'Seasonal API reachable.' })
    } catch (e) {
      setTest({
        state: 'error',
        message: e instanceof Error ? e.message : 'Connection failed.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="font-display font-bold text-xl text-rm-dark">
          API Configuration
        </h1>
        <p className="font-body text-sm text-rm-gray">
          Endpoints and the RAM API key, stored locally in this browser.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border border-rm-border bg-rm-surface p-5">
        <Field label="RAM API URL">
          <input
            type="text"
            value={form.ramApiUrl}
            onChange={(e) => update('ramApiUrl', e.target.value)}
            placeholder="https://ram-api-es-prd.azurewebsites.net"
            className="w-full rounded-md border border-rm-border bg-rm-surface px-3 py-2 font-body text-sm text-rm-dark focus:border-es-blue focus:outline-none"
          />
        </Field>

        <Field
          label="RAM API Key"
          hint="Sent in the request body on a live push only — never on a dry run."
        >
          <input
            type="password"
            value={form.ramApiKey}
            onChange={(e) => update('ramApiKey', e.target.value)}
            autoComplete="off"
            placeholder="••••••••"
            className="w-full rounded-md border border-rm-border bg-rm-surface px-3 py-2 font-body text-sm text-rm-dark focus:border-es-blue focus:outline-none"
          />
        </Field>

        <Field label="Seasonal API URL">
          <input
            type="text"
            value={form.seasonalApiUrl}
            onChange={(e) => update('seasonalApiUrl', e.target.value)}
            placeholder="http://localhost:5050"
            className="w-full rounded-md border border-rm-border bg-rm-surface px-3 py-2 font-body text-sm text-rm-dark focus:border-es-blue focus:outline-none"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-es-blue px-4 py-2 font-display text-sm font-medium text-white hover:opacity-90"
          >
            Save
          </button>
          <button
            type="button"
            onClick={testConnection}
            disabled={test.state === 'testing'}
            className="rounded-md border border-es-blue px-4 py-2 font-display text-sm font-medium text-es-blue transition-colors hover:bg-es-blue/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {test.state === 'testing' ? 'Testing…' : 'Test connection'}
          </button>
          {saved && (
            <span className="font-body text-xs text-status-ok">Saved.</span>
          )}
          {test.state === 'ok' && (
            <span className="font-body text-xs text-status-ok">{test.message}</span>
          )}
          {test.state === 'error' && (
            <span className="font-body text-xs text-status-error">
              {test.message}
            </span>
          )}
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[11px] uppercase tracking-wide text-rm-gray">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block font-body text-xs text-rm-gray">{hint}</span>}
    </label>
  )
}
