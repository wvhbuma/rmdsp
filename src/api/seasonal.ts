/*
 * Fetch-laag voor de Seasonal Planner (Flask API, zie plan §4).
 *
 * Base-URL uit VITE_SEASONAL_API_BASE_URL (config/env), met dev-fallback naar
 * localhost:5050. Net als de displacement-client checken we expliciet res.ok —
 * fetch throwt niet op 4xx/5xx.
 *
 * NB: runPipeline/implementFares nemen één args-object i.p.v. positionele
 * parameters, zodat ze direct als TanStack `mutationFn` bruikbaar zijn.
 */
import { SEASONAL_API_BASE_URL } from '@/config/env'
import type {
  DiscoverResponse,
  ImplementArgs,
  ImplementResult,
  PipelineResponse,
  RunPipelineArgs,
  SeasonalResults,
} from '@/types/seasonal'

const BASE = SEASONAL_API_BASE_URL ?? 'http://localhost:5050'

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} bij ${path}`)
  return (await res.json()) as T
}

async function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} bij ${path}`)
  return (await res.json()) as T
}

export function discoverRoutes(
  start: string,
  end: string,
  signal?: AbortSignal,
): Promise<DiscoverResponse> {
  return postJson<DiscoverResponse>('/api/seasonal/discover', { start, end }, signal)
}

export function fetchProducts(
  routes: string[],
  start: string,
  end: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return postJson<unknown>('/api/seasonal/products', { routes, start, end }, signal)
}

export function runPipeline({
  name,
  routes,
  start,
  end,
  config,
}: RunPipelineArgs): Promise<PipelineResponse> {
  return postJson<PipelineResponse>('/api/seasonal/run', {
    name,
    routes,
    start,
    end,
    config,
  })
}

export function fetchResults(signal?: AbortSignal): Promise<SeasonalResults> {
  return getJson<SeasonalResults>('/api/seasonal/results/latest', signal)
}

export function implementFares({
  apiKey,
  routes,
  cabins,
  dryRun = true,
}: ImplementArgs): Promise<ImplementResult> {
  return postJson<ImplementResult>('/api/seasonal/implement', {
    api_key: apiKey,
    routes,
    cabins,
    dry_run: dryRun,
  })
}
