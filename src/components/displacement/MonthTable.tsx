/*
 * Maandtabel met jaar-subtotalen. Gedeeld door Displacement Reporting en Monthly
 * Details. Header heeft de ES-gradient (blauw → magenta).
 *
 * De binnenkomende summary-rijen kunnen meerdere markten/richtingen bevatten;
 * we aggregeren per maand (revenue/displacement optellen, percentages opnieuw
 * berekenen — percentages mag je niet sommeren).
 */
import type { DisplacementSummary } from '@/types/displacement'
import { getYear } from '@/utils/displacement'
import { formatCurrency, formatPct } from '@/utils/format'

interface MonthAgg {
  month: string
  year: number
  bedRevenue: number
  bedDisplacement: number
  bedDepartures: number
  seatRevenue: number
  seatDisplacement: number
  seatDepartures: number
  totalRevenue: number
  totalDisplacement: number
}

function emptyAgg(month: string): MonthAgg {
  return {
    month,
    year: getYear(month),
    bedRevenue: 0,
    bedDisplacement: 0,
    bedDepartures: 0,
    seatRevenue: 0,
    seatDisplacement: 0,
    seatDepartures: 0,
    totalRevenue: 0,
    totalDisplacement: 0,
  }
}

function accumulate(agg: MonthAgg, r: DisplacementSummary): void {
  agg.bedRevenue += r.bedRevenue
  agg.bedDisplacement += r.bedDisplacement
  agg.bedDepartures += r.bedDepartures
  agg.seatRevenue += r.seatRevenue
  agg.seatDisplacement += r.seatDisplacement
  agg.seatDepartures += r.seatDepartures
  agg.totalRevenue += r.totalRevenue
  agg.totalDisplacement += r.totalDisplacement
}

function addAgg(target: MonthAgg, src: MonthAgg): void {
  target.bedRevenue += src.bedRevenue
  target.bedDisplacement += src.bedDisplacement
  target.bedDepartures += src.bedDepartures
  target.seatRevenue += src.seatRevenue
  target.seatDisplacement += src.seatDisplacement
  target.seatDepartures += src.seatDepartures
  target.totalRevenue += src.totalRevenue
  target.totalDisplacement += src.totalDisplacement
}

function pct(displacement: number, revenue: number): number {
  return revenue > 0 ? (displacement / revenue) * 100 : 0
}

type MonthTableProps = {
  rows: DisplacementSummary[]
  monthOrder: string[]
}

export function MonthTable({ rows, monthOrder }: MonthTableProps) {
  // Aggregeer per maand.
  const byMonth = new Map<string, MonthAgg>()
  for (const r of rows) {
    const agg = byMonth.get(r.month) ?? emptyAgg(r.month)
    accumulate(agg, r)
    byMonth.set(r.month, agg)
  }
  const ordered = monthOrder
    .map((m) => byMonth.get(m))
    .filter((a): a is MonthAgg => a !== undefined)

  // Groepeer in jaren (in volgorde van eerste voorkomen).
  const years: number[] = []
  for (const a of ordered) if (!years.includes(a.year)) years.push(a.year)

  function subtotal(forYear: number): MonthAgg {
    const sub = emptyAgg(`Subtotaal ${forYear}`)
    sub.year = forYear
    for (const a of ordered) {
      if (a.year === forYear) addAgg(sub, a)
    }
    return sub
  }

  const grand = emptyAgg('Totaal')
  for (const a of ordered) addAgg(grand, a)

  return (
    <div className="overflow-x-auto rounded-lg border border-rm-border">
      <table className="w-full border-collapse text-right font-body text-[13px]">
        <thead>
          <tr className="bg-gradient-to-r from-es-blue to-es-magenta text-white">
            <th className="px-3 py-2 text-left font-display font-semibold">Maand</th>
            <th className="px-3 py-2 font-display font-semibold">Bed rev</th>
            <th className="px-3 py-2 font-display font-semibold">Bed displ</th>
            <th className="px-3 py-2 font-display font-semibold">Bed %</th>
            <th className="px-3 py-2 font-display font-semibold">Seat rev</th>
            <th className="px-3 py-2 font-display font-semibold">Seat displ</th>
            <th className="px-3 py-2 font-display font-semibold">Totaal rev</th>
            <th className="px-3 py-2 font-display font-semibold">Totaal displ</th>
            <th className="px-3 py-2 font-display font-semibold">Totaal %</th>
          </tr>
        </thead>
        <tbody>
          {years.map((y) => (
            <YearBlock key={y} year={y} ordered={ordered} subtotal={subtotal(y)} />
          ))}
        </tbody>
        <tfoot>
          <TotalRow agg={grand} variant="grand" />
        </tfoot>
      </table>
    </div>
  )
}

function YearBlock({
  year,
  ordered,
  subtotal,
}: {
  year: number
  ordered: MonthAgg[]
  subtotal: MonthAgg
}) {
  return (
    <>
      {ordered
        .filter((a) => a.year === year)
        .map((a) => (
          <DataRow key={a.month} agg={a} />
        ))}
      <TotalRow agg={subtotal} variant="subtotal" />
    </>
  )
}

function DataRow({ agg }: { agg: MonthAgg }) {
  return (
    <tr className="border-t border-rm-border hover:bg-rm-gray-light/50">
      <td className="px-3 py-1.5 text-left font-medium text-rm-dark">{agg.month}</td>
      <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(agg.bedRevenue)}</td>
      <td className="px-3 py-1.5 text-villain">{formatCurrency(agg.bedDisplacement)}</td>
      <td className="px-3 py-1.5 text-rm-gray">{formatPct(pct(agg.bedDisplacement, agg.bedRevenue))}</td>
      <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(agg.seatRevenue)}</td>
      <td className="px-3 py-1.5 text-villain">{formatCurrency(agg.seatDisplacement)}</td>
      <td className="px-3 py-1.5 text-rm-dark">{formatCurrency(agg.totalRevenue)}</td>
      <td className="px-3 py-1.5 font-medium text-villain">{formatCurrency(agg.totalDisplacement)}</td>
      <td className="px-3 py-1.5 text-rm-dark">{formatPct(pct(agg.totalDisplacement, agg.totalRevenue))}</td>
    </tr>
  )
}

function TotalRow({
  agg,
  variant,
}: {
  agg: MonthAgg
  variant: 'subtotal' | 'grand'
}) {
  const base =
    variant === 'grand'
      ? 'border-t-2 border-rm-dark bg-rm-gray-light font-semibold'
      : 'border-t border-rm-border bg-rm-gray-light/60 font-medium'
  return (
    <tr className={base}>
      <td className="px-3 py-1.5 text-left text-rm-dark">{agg.month}</td>
      <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(agg.bedRevenue)}</td>
      <td className="px-3 py-1.5 text-villain">{formatCurrency(agg.bedDisplacement)}</td>
      <td className="px-3 py-1.5 text-rm-gray">{formatPct(pct(agg.bedDisplacement, agg.bedRevenue))}</td>
      <td className="px-3 py-1.5 text-rm-gray">{formatCurrency(agg.seatRevenue)}</td>
      <td className="px-3 py-1.5 text-villain">{formatCurrency(agg.seatDisplacement)}</td>
      <td className="px-3 py-1.5 text-rm-dark">{formatCurrency(agg.totalRevenue)}</td>
      <td className="px-3 py-1.5 text-villain">{formatCurrency(agg.totalDisplacement)}</td>
      <td className="px-3 py-1.5 text-rm-dark">{formatPct(pct(agg.totalDisplacement, agg.totalRevenue))}</td>
    </tr>
  )
}
