/*
 * Herbruikbare bevestigingsdialog (modal overlay). Gebruikt o.a. voor de
 * "Re-run Pipeline"-acties.
 */
import type { ReactNode } from 'react'

type ConfirmDialogProps = {
  title: string
  message: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rm-dark/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-rm-border bg-rm-surface p-5 shadow-xl">
        <h3 className="font-display font-semibold text-base text-rm-dark">{title}</h3>
        <div className="mt-2 font-body text-sm text-rm-gray">{message}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-rm-border px-4 py-2 font-display text-sm font-medium text-rm-gray hover:bg-rm-gray-light disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-es-blue px-4 py-2 font-display text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            {busy ? 'Running…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
