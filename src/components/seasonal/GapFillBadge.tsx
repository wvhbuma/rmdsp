/*
 * Badge voor de PY-gapfill methode: hoe is vorig-jaar-data gematcht/aangevuld.
 * Kleur signaleert de kwaliteit: matched=groen, proxy=blauw, cabin-avg=amber,
 * missing=rood.
 */
import type { GapFillMethod } from '@/types/seasonal'

const GAP_CLASS: Record<GapFillMethod, string> = {
  matched: 'bg-lf-green',
  cmf_slp_proxy: 'bg-es-blue',
  cabin_avg: 'bg-lf-amber',
  missing: 'bg-villain',
}

const GAP_LABEL: Record<GapFillMethod, string> = {
  matched: 'Matched',
  cmf_slp_proxy: 'CMF/SLP proxy',
  cabin_avg: 'Cabin avg',
  missing: 'Missing',
}

export function GapFillBadge({ method }: { method: GapFillMethod }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 font-body text-[10px] font-medium text-white ${GAP_CLASS[method]}`}
    >
      {GAP_LABEL[method]}
    </span>
  )
}
