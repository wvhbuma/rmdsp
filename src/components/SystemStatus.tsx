import { useEffect, useState } from 'react'
import { RAM_API_BASE_URL } from '@/config/env'

/*
 * Eenmalige health-check van RAM API. Geen retry, geen polling — dat is Fase 1+.
 *
 * Status is een discriminated union: elke render-tak behandelt één specifieke
 * variant. TypeScript dwingt volledigheid af (analoog aan Python's match-statement
 * met exhaustiveness-check).
 */
type Status =
  | { kind: 'not-configured' }
  | { kind: 'loading' }
  | { kind: 'ok' }
  | { kind: 'error'; message: string }

export function SystemStatus() {
  const [status, setStatus] = useState<Status>(() =>
    RAM_API_BASE_URL === null
      ? { kind: 'not-configured' }
      : { kind: 'loading' },
  )

  useEffect(() => {
    if (RAM_API_BASE_URL === null) return

    const controller = new AbortController()

    fetch(`${RAM_API_BASE_URL}/health`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          setStatus({
            kind: 'error',
            message: `HTTP ${res.status} ${res.statusText}`,
          })
          return
        }
        setStatus({ kind: 'ok' })
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message =
          err instanceof Error ? err.message : 'Onbekende fout'
        setStatus({ kind: 'error', message })
      })

    return () => controller.abort()
  }, [])

  return (
    <div className="bg-rm-surface border border-rm-border rounded-lg p-5">
      <h3 className="font-display font-semibold text-[13px] text-rm-dark mb-3">
        System status
      </h3>
      <StatusRow status={status} />
    </div>
  )
}

function StatusRow({ status }: { status: Status }) {
  switch (status.kind) {
    case 'not-configured':
      return (
        <div className="flex items-center gap-3">
          <Dot className="bg-status-warn" />
          <span className="font-body text-sm text-rm-gray">
            <span className="text-rm-dark font-medium">Niet geconfigureerd.</span>{' '}
            Zet <code className="font-mono text-xs">VITE_RAM_API_BASE_URL</code>{' '}
            in <code className="font-mono text-xs">.env.local</code>.
          </span>
        </div>
      )
    case 'loading':
      return (
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="font-body text-sm text-rm-gray">
            RAM API pingen…
          </span>
        </div>
      )
    case 'ok':
      return (
        <div className="flex items-center gap-3">
          <Dot className="bg-status-ok" />
          <span className="font-body text-sm text-rm-gray">
            <span className="text-rm-dark font-medium">API reachable.</span>{' '}
            <span className="text-xs">{RAM_API_BASE_URL}/health</span>
          </span>
        </div>
      )
    case 'error':
      return (
        <div className="flex items-start gap-3">
          <Dot className="bg-status-error mt-1.5" />
          <div className="font-body text-sm text-rm-gray">
            <div className="text-rm-dark font-medium">API unreachable.</div>
            <div className="text-xs mt-0.5">{status.message}</div>
            <div className="text-xs mt-0.5 text-rm-gray">
              {RAM_API_BASE_URL}/health
            </div>
          </div>
        </div>
      )
  }
}

function Dot({ className }: { className: string }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${className}`}
    />
  )
}

function Spinner() {
  return (
    <span
      className="inline-block w-3 h-3 border-2 border-rm-gray-light border-t-rm-gray rounded-full animate-spin shrink-0"
      aria-label="Loading"
    />
  )
}
