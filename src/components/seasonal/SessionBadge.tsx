/*
 * Compacte sessie-info regel voor de seasonal-pagina's:
 * "{name} · #{id} · {createdAt} · {productCount} products · {status}".
 * Alle velden behalve naam zijn optioneel — ontbrekende delen worden weggelaten
 * (graceful fallback voor oudere API-responses). Status is een gekleurde badge.
 */
import type { SeasonalSessionInfo } from '@/types/seasonal'

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
    </div>
  )
}
