/*
 * Compacte sessie-info regel voor de seasonal-pagina's:
 * "{name} · #{id} · {createdAt} · {productCount} products · {status}".
 * Alle velden behalve naam zijn optioneel — ontbrekende delen worden weggelaten
 * (graceful fallback voor oudere API-responses). Status is een gekleurde badge.
 */
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import type { SeasonalSessionInfo } from '@/types/seasonal'
import { useActiveSession } from '@/hooks/useActiveSession'
import { useSeasonalConfig } from '@/hooks/useSeasonal'
import { diffSeasonalConfig } from '@/config/seasonal'

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-rm-gray',
  reviewed: 'bg-es-blue',
  implemented: 'bg-lf-green',
}

/** ISO-datum → "4 jun 2026 19:15" (nl-NL). Leeg bij ongeldige invoer. */
function formatCreatedAt(raw?: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const date = new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
    .format(d)
    .replace('.', '')
  const time = new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
  return `${date} ${time}`
}

export function SessionBadge({ session }: { session: SeasonalSessionInfo }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { getActiveSession, clearActiveSession } = useActiveSession()
  const hasActiveSession = getActiveSession() !== null

  function resetToLatest() {
    clearActiveSession()
    void queryClient.invalidateQueries({ queryKey: ['seasonal', 'results'] })
    navigate('/season/overview')
  }

  const parts: string[] = []
  if (session.name) parts.push(session.name)
  if (session.id !== undefined && session.id !== null && session.id !== '') {
    parts.push(`#${session.id}`)
  }
  const created = formatCreatedAt(session.createdAt)
  if (created) parts.push(created)
  if (typeof session.productCount === 'number') {
    parts.push(`${session.productCount} products`)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2 font-body text-sm text-rm-gray">
        <span>{parts.join(' · ')}</span>
        {session.status && (
          <span
            className={`inline-block rounded px-1.5 py-0.5 font-display text-[10px] font-medium text-white ${
              STATUS_CLASS[session.status] ?? 'bg-rm-gray'
            }`}
          >
            {session.status}
          </span>
        )}
        {hasActiveSession && (
          <button
            type="button"
            onClick={resetToLatest}
            title="Reset to the latest computed season"
            className="font-display text-xs font-medium text-es-blue hover:underline"
          >
            Reset to latest ✕
          </button>
        )}
      </div>
      <ConfigDriftNotice session={session} />
    </div>
  )
}

/*
 * Deze cijfers zijn berekend met de config van het moment van draaien; Settings
 * toont de huidige. Wijken die af, dan kijk je naar een resultaat dat niet meer
 * bij je instellingen hoort — en dat is niet zichtbaar zonder deze melding.
 */
function ConfigDriftNotice({ session }: { session: SeasonalSessionInfo }) {
  const configQuery = useSeasonalConfig()
  const drift = diffSeasonalConfig(session.config, configQuery.data)

  if (!session.config || configQuery.isPending || drift.length === 0) return null

  return (
    <p className="font-body text-xs text-rm-dark">
      <span className="mr-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 font-display text-[10px] font-medium text-amber-800">
        Settings changed
      </span>
      {drift.map((d, i) => (
        <span key={d.destination}>
          {i > 0 && '; '}
          <span className="font-medium">{d.destination}</span> — {d.fields.join(', ')}
        </span>
      ))}
      .{' '}
      <Link to="/season/settings" className="font-medium text-es-blue hover:underline">
        Re-run to apply
      </Link>
    </p>
  )
}
