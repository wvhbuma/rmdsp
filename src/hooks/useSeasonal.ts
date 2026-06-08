/*
 * TanStack Query-hooks voor de Seasonal Planner (plan §5).
 *
 * - useDiscoverRoutes: query, alleen actief als start+end gezet zijn
 * - useSeasonalResults: query op de laatst berekende resultaten
 * - useRunPipeline / useImplement: mutations (pipeline draaien / fares pushen)
 */
import { useEffect } from 'react'
import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import * as api from '@/api/seasonal'
import { useActiveSession } from '@/hooks/useActiveSession'
import type {
  DiscoverResponse,
  ImplementArgs,
  ImplementResult,
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

/** Parset de ?session= query-param naar een positief sessie-id, of null (= latest). */
function sessionIdFromParam(raw: string | null): number | null {
  if (raw === null || !/^\d+$/.test(raw)) return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/*
 * Resultaten voor de actieve seizoen-context. Bron-prioriteit:
 *   1) ?session=<id> URL-param  → die sessie, én persisteren in localStorage
 *   2) localStorage active-session → blijft hangen bij sidebar-navigatie
 *   3) geen van beide            → /results/latest
 * Eén useQuery met een dynamische key/fn — geen voorwaardelijke hook-calls.
 */
export function useSeasonalResults(): UseQueryResult<SeasonalResults, Error> {
  const [searchParams] = useSearchParams()
  const { getActiveSession, setActiveSession } = useActiveSession()

  const urlSessionId = sessionIdFromParam(searchParams.get('session'))
  const sessionId = urlSessionId ?? getActiveSession()

  // Een sessie uit de URL wordt de nieuwe active-session (overleeft sidebar-nav).
  useEffect(() => {
    if (urlSessionId !== null) setActiveSession(urlSessionId)
  }, [urlSessionId, setActiveSession])

  return useQuery({
    queryKey:
      sessionId === null ? ['seasonal', 'results'] : ['seasonal', 'results', sessionId],
    queryFn: ({ signal }) =>
      sessionId === null
        ? api.fetchResults(signal)
        : api.fetchSessionResults(sessionId, signal),
    // Kort: na een seizoenwissel / pipeline-run snel verse data tonen op
    // pagina's die op de achtergrond gecachet stonden (Budget & Targets etc.).
    staleTime: 10_000,
  })
}

/** Resultaten van één specifieke sessie (los van de URL-context). */
export function useSessionResults(
  sessionId: number | null,
): UseQueryResult<SeasonalResults, Error> {
  return useQuery({
    queryKey: ['seasonal', 'results', sessionId],
    queryFn: ({ signal }) => api.fetchSessionResults(sessionId!, signal),
    enabled: sessionId !== null,
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

export function usePushTargets(): UseMutationResult<
  ImplementResult,
  Error,
  ImplementArgs
> {
  return useMutation({ mutationFn: api.pushTargets })
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
