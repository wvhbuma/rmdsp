/*
 * Badge voor de mask-phase van een RBD.
 * Kleuren: open=blauw, protected=magenta, start=groen, closed/non-nested=grijs.
 * (De AU-chart gebruikt MASK_PHASE_COLORS; daar is 'start' navy i.p.v. groen —
 * bewust, de badge volgt de in Sprint 3 gevraagde badge-kleuren.)
 */
import type { MaskPhase } from '@/types/seasonal'

const PHASE_CLASS: Record<MaskPhase, string> = {
  open: 'bg-es-blue',
  protected: 'bg-es-magenta',
  start: 'bg-lf-green',
  closed: 'bg-rm-gray',
  'non-nested': 'bg-rm-gray',
}

const PHASE_LABEL: Record<MaskPhase, string> = {
  open: 'Open',
  protected: 'Protected',
  start: 'Start',
  closed: 'Closed',
  'non-nested': 'Non-nested',
}

export function PhaseBadge({ phase }: { phase: MaskPhase }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 font-display text-[10px] font-medium text-white ${PHASE_CLASS[phase]}`}
    >
      {PHASE_LABEL[phase]}
    </span>
  )
}
