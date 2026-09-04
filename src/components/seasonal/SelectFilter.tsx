/*
 * Compacte label + <select> filter, gedeeld door de seasonal-pagina's.
 * Options worden als children (<option>) doorgegeven voor maximale flexibiliteit.
 */
import type { ReactNode } from 'react'

type SelectFilterProps = {
  label: string
  value: string
  onChange: (v: string) => void
  children: ReactNode
}

export function SelectFilter({ label, value, onChange, children }: SelectFilterProps) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-rm-border bg-rm-surface px-2.5 py-1.5">
      <span className="font-display text-[11px] uppercase tracking-wide text-rm-gray">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[260px] bg-transparent font-body text-[13px] text-rm-dark focus:outline-none"
      >
        {children}
      </select>
    </label>
  )
}
