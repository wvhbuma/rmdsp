/*
 * Badge die toont welke constraint een target bindt (elasticiteit, yield floor,
 * …). Neutrale pill met het Nederlandse label uit BINDING_LABELS.
 */
import type { TargetBinding } from '@/types/seasonal'
import { BINDING_LABELS } from '@/config/seasonal'

export function BindingBadge({ binding }: { binding: TargetBinding }) {
  return (
    <span className="inline-block rounded bg-rm-gray-light px-1.5 py-0.5 font-body text-[10px] font-medium text-rm-dark">
      {BINDING_LABELS[binding] ?? binding}
    </span>
  )
}
