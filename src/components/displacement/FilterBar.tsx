/*
 * Filterbalk in macOS-menubar-stijl: een rij knoppen (Route, Cabin, Jaar,
 * Periode) die elk een dropdown-paneel openen. Eén paneel tegelijk open;
 * klik-buiten sluit. State is volledig gecontroleerd door de pagina via
 * value/onChange — de balk houdt zelf alleen bij welk paneel open is.
 *
 * periodMode bepaalt of Periode multi-select (checkboxes) of single-select
 * (radio) is: landing + monthly = multi, departures = single.
 */
import { useEffect, useRef, useState } from 'react'
import type { DisplacementResponse } from '@/types/displacement'
import {
  cabinBgClass,
  cabinLabel,
  sortCabins,
  stationShort,
} from '@/config/displacement'
import {
  listYears,
  monthsForYear,
  routesForMarket,
  type DisplacementFilter,
  type PeriodMode,
} from '@/utils/displacement'
import { Icon } from '@/layout/icons'
import { useUserPreferences } from '@/hooks/useUserPreferences'

/** "BEMI-PRA" → "BRU → PRA". */
function formatRouteCode(code: string): string {
  return code
    .split('-')
    .map((c) => stationShort(c))
    .join(' → ')
}

type FilterBarProps = {
  data: DisplacementResponse
  value: DisplacementFilter
  onChange: (next: DisplacementFilter) => void
  periodMode: PeriodMode
}

export function FilterBar({ data, value, onChange, periodMode }: FilterBarProps) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Klik buiten de balk sluit het open paneel.
  useEffect(() => {
    if (openKey === null) return
    function onDocClick(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenKey(null)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [openKey])

  // Route Assignment (User Preferences): alleen toegewezen markten/richtingen tonen.
  const { isMarketEnabled, isDirectionEnabled } = useUserPreferences()

  const years = listYears(data.months)
  const availableMonths = monthsForYear(data.months, value.year)
  const cabins = sortCabins(data.cabins)
  const markets = data.markets.filter(isMarketEnabled)
  const routes = routesForMarket(data, value.market).filter(isDirectionEnabled)

  function patch(next: Partial<DisplacementFilter>) {
    onChange({ ...value, ...next })
  }

  // Labels op de knoppen (huidige selectie samenvatten).
  const routeLabel =
    value.route === 'all'
      ? `${value.market || 'Alle'} · beide`
      : `${value.market} · ${formatRouteCode(value.route)}`
  const cabinSummary =
    value.cabins.length === 0
      ? 'Alle cabins'
      : value.cabins.map(cabinLabel).join(', ')
  const yearLabel = value.year === 'all' ? 'Alle jaren' : String(value.year)
  const periodLabel =
    value.months.length === 0
      ? periodMode === 'single'
        ? 'Kies maand'
        : 'Hele jaar'
      : value.months.length === 1
        ? value.months[0]
        : `${value.months.length} maanden`

  return (
    <div
      ref={barRef}
      className="flex flex-wrap items-center gap-1 border-b border-rm-border bg-rm-surface px-4 py-2"
    >
      {/* Route + richting */}
      <MenuButton
        label="Route"
        summary={routeLabel}
        isOpen={openKey === 'route'}
        onToggle={() => setOpenKey(openKey === 'route' ? null : 'route')}
      >
        <PanelSection title="Markt">
          {markets.length === 0 && (
            <div className="px-3 py-1.5 font-body text-xs text-rm-gray">
              Geen routes toegewezen — zie User Preferences.
            </div>
          )}
          {markets.map((m) => (
            <RadioRow
              key={m}
              label={m}
              checked={value.market === m}
              onSelect={() => patch({ market: m, route: 'all' })}
            />
          ))}
        </PanelSection>
        <PanelSection title="Richting">
          <RadioRow
            label="Beide richtingen"
            checked={value.route === 'all'}
            onSelect={() => patch({ route: 'all' })}
          />
          {routes.map((r) => (
            <RadioRow
              key={r}
              label={formatRouteCode(r)}
              checked={value.route === r}
              onSelect={() => patch({ route: r })}
            />
          ))}
        </PanelSection>
      </MenuButton>

      {/* Cabin (multi) */}
      <MenuButton
        label="Cabin"
        summary={cabinSummary}
        isOpen={openKey === 'cabin'}
        onToggle={() => setOpenKey(openKey === 'cabin' ? null : 'cabin')}
      >
        <PanelSection>
          <RadioRow
            label="Alle cabins"
            checked={value.cabins.length === 0}
            onSelect={() => patch({ cabins: [] })}
          />
          {cabins.map((c) => (
            <CheckRow
              key={c}
              label={cabinLabel(c)}
              dotClass={cabinBgClass(c)}
              checked={value.cabins.includes(c)}
              onToggle={() => {
                const next = value.cabins.includes(c)
                  ? value.cabins.filter((x) => x !== c)
                  : [...value.cabins, c]
                patch({ cabins: next })
              }}
            />
          ))}
        </PanelSection>
      </MenuButton>

      {/* Jaar */}
      <MenuButton
        label="Jaar"
        summary={yearLabel}
        isOpen={openKey === 'year'}
        onToggle={() => setOpenKey(openKey === 'year' ? null : 'year')}
      >
        <PanelSection>
          <RadioRow
            label="Alle jaren"
            checked={value.year === 'all'}
            onSelect={() => patch({ year: 'all', months: [] })}
          />
          {years.map((y) => (
            <RadioRow
              key={y}
              label={String(y)}
              checked={value.year === y}
              onSelect={() => patch({ year: y, months: [] })}
            />
          ))}
        </PanelSection>
      </MenuButton>

      {/* Periode (maanden) */}
      <MenuButton
        label="Periode"
        summary={periodLabel}
        isOpen={openKey === 'period'}
        onToggle={() => setOpenKey(openKey === 'period' ? null : 'period')}
      >
        <PanelSection>
          {periodMode === 'multi' && (
            <div className="flex gap-2 px-2 pb-1.5 mb-1 border-b border-rm-border">
              <button
                type="button"
                className="text-xs text-es-blue hover:underline"
                onClick={() => patch({ months: [...availableMonths] })}
              >
                Alles
              </button>
              <button
                type="button"
                className="text-xs text-rm-gray hover:underline"
                onClick={() => patch({ months: [] })}
              >
                Wissen
              </button>
            </div>
          )}
          {availableMonths.map((m) =>
            periodMode === 'single' ? (
              <RadioRow
                key={m}
                label={m}
                checked={value.months[0] === m}
                onSelect={() => patch({ months: [m] })}
              />
            ) : (
              <CheckRow
                key={m}
                label={m}
                checked={value.months.includes(m)}
                onToggle={() => {
                  const next = value.months.includes(m)
                    ? value.months.filter((x) => x !== m)
                    : [...value.months, m]
                  patch({ months: next })
                }}
              />
            ),
          )}
        </PanelSection>
      </MenuButton>
    </div>
  )
}

function MenuButton({
  label,
  summary,
  isOpen,
  onToggle,
  children,
}: {
  label: string
  summary: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-[13px] transition-colors ${
          isOpen
            ? 'bg-rm-gray-light text-rm-dark'
            : 'text-rm-gray hover:bg-rm-gray-light hover:text-rm-dark'
        }`}
      >
        <span className="font-medium text-rm-dark">{label}</span>
        <span className="text-rm-gray max-w-[180px] truncate">{summary}</span>
        <Icon
          name="chevron-down"
          className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-[60vh] min-w-[200px] overflow-y-auto rounded-lg border border-rm-border bg-rm-surface py-1.5 shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

function PanelSection({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className="py-1 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-rm-border">
      {title && (
        <div className="px-3 pb-1 pt-1 font-display text-[10px] uppercase tracking-wide text-rm-gray">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

function RadioRow({
  label,
  checked,
  onSelect,
}: {
  label: string
  checked: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-body text-[13px] text-rm-dark hover:bg-rm-gray-light"
    >
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        {checked && <Icon name="check" className="h-3.5 w-3.5 text-es-blue" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}

function CheckRow({
  label,
  checked,
  onToggle,
  dotClass,
}: {
  label: string
  checked: boolean
  onToggle: () => void
  dotClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-body text-[13px] text-rm-dark hover:bg-rm-gray-light"
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
          checked ? 'border-es-blue bg-es-blue' : 'border-rm-border'
        }`}
      >
        {checked && <Icon name="check" className="h-3 w-3 text-white" />}
      </span>
      {dotClass && (
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} />
      )}
      <span className="truncate">{label}</span>
    </button>
  )
}
