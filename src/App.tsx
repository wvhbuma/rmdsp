import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthGate } from '@/auth/AuthGate'
import { Layout } from '@/layout/Layout'
import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'
import { FlightOverview } from '@/pages/_placeholders/FlightOverview'
import { Cockpit } from '@/pages/_placeholders/Cockpit'
import { NetworkView } from '@/pages/_placeholders/NetworkView'
import { FareRecommender } from '@/pages/_placeholders/FareRecommender'
import { WeeklyPerformance } from '@/pages/_placeholders/WeeklyPerformance'
import { MonthlyPerformance } from '@/pages/_placeholders/MonthlyPerformance'
import { DecisionSupport } from '@/pages/_placeholders/DecisionSupport'
import { PerformanceAnalysis } from '@/pages/_placeholders/PerformanceAnalysis'
import { CustomerAnalytics } from '@/pages/_placeholders/CustomerAnalytics'
import { OperationalImpact } from '@/pages/_placeholders/OperationalImpact'
import { MarginManagement } from '@/pages/_placeholders/MarginManagement'
import { CompetitorIntel } from '@/pages/_placeholders/CompetitorIntel'
import { DistributionChannels } from '@/pages/_placeholders/DistributionChannels'
import { Overbooking } from '@/pages/_placeholders/Overbooking'
import { Ancillary } from '@/pages/_placeholders/Ancillary'
import { BudgetTargets } from '@/pages/BudgetTargets'
import { AuditTrail } from '@/pages/_placeholders/AuditTrail'
import { DecisionLog } from '@/pages/_placeholders/DecisionLog'
import { ApprovalRules } from '@/pages/_placeholders/ApprovalRules'
import { DisplacementReporting } from '@/pages/displacement/DisplacementReporting'
import { DisplacementMonthly } from '@/pages/displacement/DisplacementMonthly'
import { DisplacementDepartures } from '@/pages/displacement/DisplacementDepartures'
import { UserPreferences } from '@/pages/settings/UserPreferences'
import { NewSeason } from '@/pages/seasonal/NewSeason'
import { SeasonOverview } from '@/pages/seasonal/SeasonOverview'
import { SeasonTargets } from '@/pages/seasonal/SeasonTargets'
import { SeasonMasks } from '@/pages/seasonal/SeasonMasks'
import { SeasonSimulation } from '@/pages/seasonal/SeasonSimulation'
import { SeasonImplement } from '@/pages/seasonal/SeasonImplement'
import { SeasonSettings } from '@/pages/seasonal/SeasonSettings'

export function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />

            {/* Flight Optimization */}
            <Route path="flight-overview" element={<FlightOverview />} />
            <Route path="cockpit" element={<Cockpit />} />
            <Route path="network-view" element={<NetworkView />} />
            <Route path="fare-recommender" element={<FareRecommender />} />

            {/* Business Overview */}
            <Route path="weekly" element={<WeeklyPerformance />} />
            <Route path="monthly" element={<MonthlyPerformance />} />
            <Route path="decision-support" element={<DecisionSupport />} />
            <Route path="performance-analysis" element={<PerformanceAnalysis />} />
            <Route path="customer-analytics" element={<CustomerAnalytics />} />
            <Route path="operational-impact" element={<OperationalImpact />} />
            <Route path="margin-management" element={<MarginManagement />} />
            <Route path="competitor-intel" element={<CompetitorIntel />} />

            {/* Multi-Leg Analysis */}
            <Route path="displacement" element={<DisplacementReporting />} />
            <Route path="displacement/monthly" element={<DisplacementMonthly />} />
            <Route path="displacement/departures" element={<DisplacementDepartures />} />

            {/* Business Management */}
            <Route path="distribution-channels" element={<DistributionChannels />} />
            <Route path="overbooking" element={<Overbooking />} />
            <Route path="ancillary" element={<Ancillary />} />
            <Route path="budget-targets" element={<BudgetTargets />} />

            {/* Season Planning */}
            <Route path="season/new" element={<NewSeason />} />
            <Route path="season/overview" element={<SeasonOverview />} />
            <Route path="season/targets" element={<SeasonTargets />} />
            <Route path="season/masks" element={<SeasonMasks />} />
            <Route path="season/simulation" element={<SeasonSimulation />} />
            <Route path="season/implement" element={<SeasonImplement />} />
            <Route path="season/settings" element={<SeasonSettings />} />

            {/* Settings */}
            <Route path="audit" element={<AuditTrail />} />
            <Route path="decision-log" element={<DecisionLog />} />
            <Route path="approval-rules" element={<ApprovalRules />} />
            <Route path="settings/preferences" element={<UserPreferences />} />

            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthGate>
    </BrowserRouter>
  )
}
