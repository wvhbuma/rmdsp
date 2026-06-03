/*
 * Centrale hook voor alle User Preferences. Leest/schrijft de drie
 * localStorage-instellingen (feature-visibility, chart-prefs, route-assignment)
 * en biedt afgeleide helpers (isFeatureEnabled, isMarketEnabled, …).
 *
 * De stores zijn module-singletons (buiten de hook), zodat elke component die
 * deze hook gebruikt dezelfde state deelt en samen her-rendert bij een wijziging.
 */
import { useCallback } from 'react'
import {
  createPersistentStore,
  usePersistentStore,
} from '@/utils/persistentStore'
import {
  DEFAULT_CHART_PREFS,
  DEFAULT_ROUTE_ASSIGNMENT,
  STORAGE_KEYS,
  isValidRouteAssignment,
  type ChartPrefs,
  type ChartType,
  type FeatureVisibility,
  type PaletteId,
  type RouteAssignment,
} from '@/config/userPreferences'

const featuresStore = createPersistentStore<FeatureVisibility>(
  STORAGE_KEYS.features,
  {},
)
const chartPrefsStore = createPersistentStore<ChartPrefs>(
  STORAGE_KEYS.chartPrefs,
  DEFAULT_CHART_PREFS,
)
const routesStore = createPersistentStore<RouteAssignment>(
  STORAGE_KEYS.routes,
  DEFAULT_ROUTE_ASSIGNMENT,
  isValidRouteAssignment, // oude shape ({markets,directions}) → val terug op default
)

function toggleInArray(arr: string[], value: string, enabled: boolean): string[] {
  const has = arr.includes(value)
  if (enabled && !has) return [...arr, value]
  if (!enabled && has) return arr.filter((v) => v !== value)
  return arr
}

export interface UseUserPreferences {
  // Feature Visibility
  features: FeatureVisibility
  isFeatureEnabled: (path: string) => boolean
  setFeatureEnabled: (path: string, enabled: boolean) => void
  setFeaturesEnabled: (paths: string[], enabled: boolean) => void

  // Chart Preferences
  chartPrefs: ChartPrefs
  setChartPalette: (chart: ChartType, palette: PaletteId) => void

  // Route Assignment (op route-niveau)
  routes: RouteAssignment
  isRouteEnabled: (route: string) => boolean
  setRouteEnabled: (route: string, enabled: boolean) => void
}

export function useUserPreferences(): UseUserPreferences {
  const features = usePersistentStore(featuresStore)
  const chartPrefs = usePersistentStore(chartPrefsStore)
  const routes = usePersistentStore(routesStore)

  const isFeatureEnabled = useCallback(
    (path: string) => features[path] !== false, // ontbrekend = aan
    [features],
  )

  const setFeatureEnabled = useCallback((path: string, enabled: boolean) => {
    featuresStore.set((prev) => ({ ...prev, [path]: enabled }))
  }, [])

  const setFeaturesEnabled = useCallback(
    (paths: string[], enabled: boolean) => {
      featuresStore.set((prev) => {
        const next = { ...prev }
        for (const p of paths) next[p] = enabled
        return next
      })
    },
    [],
  )

  const setChartPalette = useCallback((chart: ChartType, palette: PaletteId) => {
    chartPrefsStore.set((prev) => ({ ...prev, [chart]: palette }))
  }, [])

  const isRouteEnabled = useCallback(
    (route: string) => routes.routes.includes(route),
    [routes],
  )

  const setRouteEnabled = useCallback((route: string, enabled: boolean) => {
    routesStore.set((prev) => ({
      ...prev,
      routes: toggleInArray(prev.routes, route, enabled),
    }))
  }, [])

  return {
    features,
    isFeatureEnabled,
    setFeatureEnabled,
    setFeaturesEnabled,
    chartPrefs,
    setChartPalette,
    routes,
    isRouteEnabled,
    setRouteEnabled,
  }
}
