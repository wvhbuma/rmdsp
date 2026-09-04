/*
 * Gedeelde laad-/fout-/lege-staten voor de displacement-pagina's.
 * Klein en bewust simpel — geen skeleton-framework in Fase 1.
 */

export function LoadingState({ label = 'Data laden…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-rm-gray">
      <span
        className="inline-block w-4 h-4 border-2 border-rm-gray-light border-t-es-blue rounded-full animate-spin"
        aria-label="Loading"
      />
      <span className="font-body text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({
  message,
  title = 'Kon displacement-data niet laden',
}: {
  message: string
  title?: string
}) {
  return (
    <div className="m-6 rounded-lg border border-status-error/30 bg-status-error/5 p-5">
      <div className="font-display font-semibold text-sm text-status-error mb-1">
        {title}
      </div>
      <div className="font-body text-xs text-rm-gray">{message}</div>
    </div>
  )
}

export function EmptyState({
  message = 'Geen data voor de huidige selectie.',
}: {
  message?: string
}) {
  return (
    <div className="py-16 text-center font-body text-sm text-rm-gray">
      {message}
    </div>
  )
}
