/*
 * Load-factor heatmap als custom HTML-tabel (bewust géén ECharts — we willen
 * klikbare rijen, een sticky eerste kolom en kleur-gecodeerde cellen).
 *
 * Rijen = vertrekdata (voor de actieve cabin), kolommen = legs. Celwaarde is de
 * leg-LF = onboard / cabin-capaciteit. Tekst is altijd wit voor contrast op de
 * gekleurde achtergrond.
 */
import type {
  DisplacementDeparture,
  DisplacementLeg,
  LegData,
} from '@/types/displacement'
import { stationShort } from '@/config/displacement'
import { formatLf } from '@/utils/format'

/** "BEMI→ANCT" → "BRU→ANC". */
function shortLegLabel(label: string): string {
  return label
    .split('→')
    .map((c) => stationShort(c.trim()))
    .join('→')
}

/** LF-fractie → Tailwind bg-class (groen → geel → oranje → rood). */
function lfClass(lf: number): string {
  if (lf >= 0.95) return 'bg-lf-red'
  if (lf >= 0.85) return 'bg-lf-orange'
  if (lf >= 0.7) return 'bg-lf-amber'
  return 'bg-lf-green'
}

interface LegColumn {
  leg: number
  label: string
}

type LfHeatmapProps = {
  legs: DisplacementLeg[]
  departures: DisplacementDeparture[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

export function LfHeatmap({
  legs,
  departures,
  selectedDate,
  onSelectDate,
}: LfHeatmapProps) {
  // Capaciteit per datum (cabin is al vastgezet door de pagina).
  const capByDate = new Map<string, number>()
  for (const d of departures) {
    capByDate.set(d.date, (capByDate.get(d.date) ?? 0) + d.capacity)
  }

  // Kolommen: unieke legs over alle rijen, op leg-nummer gesorteerd.
  const colMap = new Map<number, LegColumn>()
  for (const row of legs) {
    for (const l of row.legs) {
      if (!colMap.has(l.leg)) {
        colMap.set(l.leg, { leg: l.leg, label: shortLegLabel(l.label) })
      }
    }
  }
  const columns = [...colMap.values()].sort((a, b) => a.leg - b.leg)

  // Rijen: per datum, in chronologische volgorde.
  const rows = [...legs].sort((a, b) => a.date.localeCompare(b.date))

  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className="py-12 text-center font-body text-sm text-rm-gray">
        Geen leg-data voor deze selectie.
      </div>
    )
  }

  function legLf(row: DisplacementLeg, leg: number): number | null {
    const data: LegData | undefined = row.legs.find((l) => l.leg === leg)
    if (!data) return null
    const cap = capByDate.get(row.date) ?? 0
    return cap > 0 ? data.onboard / cap : 0
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-rm-border">
      <table className="border-collapse text-center font-body text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-rm-surface px-3 py-2 text-left font-display font-semibold text-rm-dark border-b border-rm-border">
              Vertrek
            </th>
            {columns.map((c) => (
              <th
                key={c.leg}
                className="px-3 py-2 font-display font-semibold text-rm-dark border-b border-rm-border whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = row.date === selectedDate
            return (
              <tr
                key={row.date}
                onClick={() => onSelectDate(row.date)}
                className={`cursor-pointer ${isSelected ? 'outline outline-2 outline-es-blue' : ''}`}
              >
                <td
                  className={`sticky left-0 z-10 px-3 py-1.5 text-left font-medium whitespace-nowrap border-b border-rm-border ${
                    isSelected ? 'bg-rm-gray-light text-rm-dark' : 'bg-rm-surface text-rm-dark'
                  }`}
                >
                  {row.date}
                </td>
                {columns.map((c) => {
                  const lf = legLf(row, c.leg)
                  if (lf === null) {
                    return (
                      <td
                        key={c.leg}
                        className="px-3 py-1.5 text-rm-gray border-b border-rm-border"
                      >
                        –
                      </td>
                    )
                  }
                  return (
                    <td
                      key={c.leg}
                      className={`px-3 py-1.5 font-medium text-white border-b border-white/30 ${lfClass(lf)}`}
                    >
                      {formatLf(lf)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
