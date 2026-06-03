/*
 * User Preferences — drie secties die elk een localStorage-instelling beheren:
 *   1. Feature Visibility  (ram_user_features)   → toont/verbergt nav-pagina's
 *   2. Chart Preferences   (ram_user_chart_prefs) → kleurenpalet per chart-type
 *   3. Route Assignment    (ram_user_routes)      → routes in de filter-dropdowns
 *
 * Alle wijzigingen zijn meteen actief (geen "opslaan"-knop): de secties schrijven
 * direct naar de gedeelde stores, waarop o.a. de Sidebar en de FilterBar reageren.
 */
import type { ReactNode } from 'react'
import { FeatureVisibilitySection } from '@/components/settings/FeatureVisibilitySection'
import { ChartPreferencesSection } from '@/components/settings/ChartPreferencesSection'
import { RouteAssignmentSection } from '@/components/settings/RouteAssignmentSection'

export function UserPreferences() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="font-display font-bold text-xl text-rm-dark">
          User Preferences
        </h1>
        <p className="font-body text-sm text-rm-gray">
          Persoonlijke instellingen, lokaal opgeslagen in deze browser.
        </p>
      </header>

      <PrefBlock
        title="Feature Visibility"
        description="Bepaal welke groepen en pagina's in de zijbalk verschijnen. Uitgeschakeld = verborgen."
      >
        <FeatureVisibilitySection />
      </PrefBlock>

      <PrefBlock
        title="Chart Preferences"
        description="Kies per chart-type een kleurenpalet."
      >
        <ChartPreferencesSection />
      </PrefBlock>

      <PrefBlock
        title="Route Assignment"
        description="Wijs routes toe; alleen toegewezen routes verschijnen in de filters."
      >
        <RouteAssignmentSection />
      </PrefBlock>
    </div>
  )
}

function PrefBlock({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="font-display font-semibold text-base text-rm-dark">
          {title}
        </h2>
        <p className="font-body text-xs text-rm-gray">{description}</p>
      </div>
      {children}
    </section>
  )
}
