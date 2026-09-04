/*
 * Eenvoudige kaart-container met titel/subtitel voor secties op de
 * displacement-pagina's. Optionele `actions`-slot rechtsboven (bv. cabin-tabs).
 */
import type { ReactNode } from 'react'

type SectionCardProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function SectionCard({
  title,
  subtitle,
  actions,
  className,
  children,
}: SectionCardProps) {
  return (
    <section
      className={`rounded-lg border border-rm-border bg-rm-surface p-4 ${className ?? ''}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-sm text-rm-dark">{title}</h3>
          {subtitle && (
            <p className="font-body text-xs text-rm-gray">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
