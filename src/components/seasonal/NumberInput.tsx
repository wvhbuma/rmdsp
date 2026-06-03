/*
 * Klein gecontroleerd nummer-invoerveld voor de Settings-tabellen/cards.
 * Geeft de geparste numerieke waarde door (NaN → 0).
 */
type NumberInputProps = {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  className?: string
}

export function NumberInput({
  value,
  onChange,
  step = 0.01,
  min,
  max,
  className,
}: NumberInputProps) {
  return (
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => {
        const n = Number(e.target.value)
        onChange(Number.isNaN(n) ? 0 : n)
      }}
      className={`w-20 rounded-md border border-rm-border bg-rm-surface px-2 py-1 text-right font-body text-[13px] text-rm-dark focus:border-es-blue focus:outline-none ${className ?? ''}`}
    />
  )
}
