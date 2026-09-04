/*
 * Eén KPI-card: grote waarde + label + optionele subtekst en accentkleur.
 * De accent bepaalt de kleur van de waarde (rood voor kosten, blauw voor
 * constrained, etc.). Zie de visuele spec in de displacement-prompt.
 */

export type KpiAccent = 'neutral' | 'red' | 'blue' | 'magenta' | 'green'

const ACCENT_TEXT: Record<KpiAccent, string> = {
  neutral: 'text-rm-dark',
  red: 'text-villain',
  blue: 'text-es-blue',
  magenta: 'text-es-magenta',
  green: 'text-lf-green',
}

type KpiCardProps = {
  label: string
  value: string
  sub?: string
  accent?: KpiAccent
}

export function KpiCard({ label, value, sub, accent = 'neutral' }: KpiCardProps) {
  return (
    <div className="bg-rm-surface border border-rm-border rounded-lg p-4 flex flex-col gap-1">
      <span className="font-display font-medium text-[11px] uppercase tracking-wide text-rm-gray">
        {label}
      </span>
      <span className={`font-display font-bold text-2xl leading-tight ${ACCENT_TEXT[accent]}`}>
        {value}
      </span>
      {sub && <span className="font-body text-xs text-rm-gray">{sub}</span>}
    </div>
  )
}
