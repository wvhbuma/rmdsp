/*
 * Tabs voor de bestemmingen in Season Settings. Actieve tab krijgt een
 * ES-blue accent-onderrand.
 */
type DestinationTabsProps = {
  destinations: string[]
  active: string
  onSelect: (destination: string) => void
}

export function DestinationTabs({ destinations, active, onSelect }: DestinationTabsProps) {
  return (
    <div className="flex gap-1 border-b border-rm-border">
      {destinations.map((d) => {
        const isActive = d === active
        return (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            className={`-mb-px border-b-2 px-4 py-2 font-display text-[13px] font-medium transition-colors ${
              isActive
                ? 'border-es-blue text-rm-dark'
                : 'border-transparent text-rm-gray hover:text-rm-dark'
            }`}
          >
            {d}
          </button>
        )
      })}
    </div>
  )
}
