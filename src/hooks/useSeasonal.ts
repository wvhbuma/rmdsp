/*
 * TanStack Query-hooks voor de Seasonal Planner (plan §5).
 *
 * - useDiscoverRoutes: query, alleen actief als start+end gezet zijn
 * - useSeasonalResults: query op de laatst berekende resultaten
 * - useRunPipeline / useImplement: mutations (pipeline draaien / fares pushen)
 */
import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import * as api from '@/api/seasonal'
import type {
  DiscoverResponse,
  ImplementArgs,
  ImplementResult,
  ImplementStatus,
  PipelineResponse,
  ProductsResponse,
  RunPipelineArgs,
  SeasonalConfig,
  SeasonalResults,
  SeasonalSession,
} from '@/types/seasonal'

export function useDiscoverRoutes(
  start: string,
  end: string,
): UseQueryResult<DiscoverResponse, Error> {
  return useQuery({
    queryKey: ['seasonal', 'discover', start, end],
    queryFn: ({ signal }) => api.discoverRoutes(start, end, signal),
    enabled: Boolean(start) && Boolean(end),
    staleTime: 5 * 60_000,
  })
}

export function useSeasonalProducts(
  routes: string[],
  start: string,
  end: string,
  enabled: boolean,
): UseQueryResult<ProductsResponse, Error> {
  return useQuery({
    queryKey: ['seasonal', 'products', routes, start, end],
    queryFn: ({ signal }) => api.fetchProducts(routes, start, end, signal),
    enabled: enabled && routes.length > 0 && Boolean(start) && Boolean(end),
    staleTime: 5 * 60_000,
  })
}

export function useSeasonalResults(): UseQueryResult<SeasonalResults, Error> {
  return useQuery({
    queryKey: ['seasonal', 'results'],
    queryFn: ({ signal }) => api.fetchResults(signal),
    staleTime: 60_000,
  })
}

export function useSeasonalSessions(): UseQueryResult<SeasonalSession[], Error> {
  return useQuery({
    queryKey: ['seasonal', 'sessions'],
    queryFn: ({ signal }) => api.fetchSessions(signal),
    staleTime: 5 * 60_000,
  })
}

export function useRunPipeline(): UseMutationResult<
  PipelineResponse,
  Error,
  RunPipelineArgs
> {
  return useMutation({ mutationFn: api.runPipeline })
}

export function useImplement(): UseMutationResult<
  ImplementResult,
  Error,
  ImplementArgs
> {
  return useMutation({ mutationFn: api.implementFares })
}

/*
 * Of de RAM API key server-side gezet is. retry:false → een 404 (endpoint nog
 * niet aanwezig) faalt direct en we behandelen de key dan als niet-geconfigureerd,
 * zodat de LIVE Push-knop veiligheidshalve disabled blijft.
 */
export function useImplementStatus(): UseQueryResult<ImplementStatus, Error> {
  return useQuery({
    queryKey: ['seasonal', 'implement', 'status'],
    queryFn: ({ signal }) => api.fetchImplementStatus(signal),
    staleTime: 60_000,
    retry: false,
  })
}

export function useSaveConfig(): UseMutationResult<void, Error, SeasonalConfig> {
  return useMutation({ mutationFn: api.saveConfig })
}

export function useSeasonalConfig(): UseQueryResult<SeasonalConfig, Error> {
  return useQuery({
    queryKey: ['seasonal', 'config'],
    queryFn: api.getConfig,
    staleTime: 60_000,
  })
}
