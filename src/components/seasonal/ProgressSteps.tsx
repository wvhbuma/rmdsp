/*
 * Stap-indicator voor de NewSeason-wizard. Toont genummerde stappen met de
 * actieve/voltooide stap in ES-blue.
 */
import { Icon } from '@/layout/icons'

type ProgressStepsProps = {
  steps: string[]
  current: number
}

export function ProgressSteps({ steps, current }: ProgressStepsProps) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full font-display text-xs font-semibold ${
                  done
                    ? 'bg-es-blue text-white'
                    : active
                      ? 'border-2 border-es-blue text-es-blue'
                      : 'border border-rm-border text-rm-gray'
                }`}
              >
                {done ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={`font-display text-[13px] ${
                  active ? 'font-semibold text-rm-dark' : 'text-rm-gray'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="mx-1 h-px w-8 bg-rm-border" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
