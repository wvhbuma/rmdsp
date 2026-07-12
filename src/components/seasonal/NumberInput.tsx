/*
 * Klein gecontroleerd nummer-invoerveld voor de Settings-tabellen/cards.
 *
 * Houdt een interne tekst-state bij zodat tussenstaten als "-" of "1." blijven
 * staan tijdens het typen (nodig voor negatieve waarden zoals elasticiteiten,
 * bv. -1.1). Pas bij een geldig getal wordt onChange aangeroepen. Externe
 * wijzigingen (Reset / Load config) syncen terug naar het tekstveld.
 *
 * Vaste breedte + gecentreerde waarde zodat de box niet verspringt.
 */
import { useEffect, useRef, useState } from 'react'

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
  const [text, setText] = useState(() => String(value))
  // Laatst door dit veld doorgegeven waarde — om eigen updates te onderscheiden
  // van externe (Reset/Load), zodat we tijdens typen niet resetten.
  const emitted = useRef(value)

  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value
      setText(String(value))
    }
  }, [value])

  function handle(raw: string) {
    setText(raw)
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return
    const n = Number(raw)
    if (!Number.isNaN(n)) {
      emitted.current = n
      onChange(n)
    }
  }

  return (
    <input
      type="number"
      value={text}
      step={step}
      min={min}
      max={max}
      onChange={(e) => handle(e.target.value)}
      className={`w-24 shrink-0 rounded-md border border-rm-border bg-rm-surface px-2 py-1 text-center font-body text-[13px] text-rm-dark focus:border-es-blue focus:outline-none ${className ?? ''}`}
    />
  )
}
