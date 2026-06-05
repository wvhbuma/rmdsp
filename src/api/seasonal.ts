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
  ImplementStatus,
  PipelineResponse,
  ProductsResponse,
  RunPipelineArgs,
  SeasonalConfig,
  SeasonalResults,
  SeasonalSession,
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
): Promise<ProductsResponse> {
  return postJson<ProductsResponse>('/api/seasonal/products', { routes, start, end }, signal)
}

export function runPipeline({
  name,
  routes,
  start,
  end,
  config,
  profileAssignments,
}: RunPipelineArgs): Promise<PipelineResponse> {
  const body = {
    name,
    routes,
    start,
    end,
    config,
    profile_assignments: profileAssignments,
  }
  // DEBUG: log de volledige request body — check of profile_assignments
  // meegestuurd wordt en in welk format (date/market/profile).
  console.log('Run pipeline body:', JSON.stringify(body))
  return postJson<PipelineResponse>('/api/seasonal/run', body)
}

export function fetchResults(signal?: AbortSignal): Promise<SeasonalResults> {
  return getJson<SeasonalResults>('/api/seasonal/results/latest', signal)
}

/*
 * GET /api/seasonal/config → leest seasonal-config.json van disk.
 * POST /api/seasonal/config → schrijft het config-object naar disk.
 * De config staat los van een sessie.
 */
export async function getConfig(): Promise<SeasonalConfig> {
  const res = await fetch(`${BASE}/api/seasonal/config`)
  if (!res.ok) throw new Error('Failed to load config')
  return (await res.json()) as SeasonalConfig
}

export async function saveConfig(config: SeasonalConfig): Promise<void> {
  const res = await fetch(`${BASE}/api/seasonal/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} bij /api/seasonal/config`)
  }
}

/** Bestaande seizoenen (Excel-bestanden in ~/Seasonal Planning/). */
export function fetchSessions(signal?: AbortSignal): Promise<SeasonalSession[]> {
  return getJson<SeasonalSession[]>('/api/seasonal/sessions', signal)
}

/*
 * De API key wordt NIET meegestuurd: de Flask server gebruikt de server-side
 * env var RAM_API_KEY. De body bevat alleen dry_run (snake_case) + optionele
 * route/cabin-filters. Lege filters → de key valt weg uit de JSON (undefined),
 * dus de server pusht dan alles.
 *
 * Wire-format van de respons is snake_case (status: 'dry_run' | 'ok' | 'error',
 * fare_items); we mappen het naar de camelCase ImplementResult.
 */
interface ImplementResponseWire {
  status: 'dry_run' | 'ok' | 'error'
  pushed: number
  skipped: number
  log: string[]
  products?: number
  fare_items?: number
}

export async function implementFares({
  routes,
  cabins,
  dryRun = true,
}: ImplementArgs): Promise<ImplementResult> {
  const wire = await postJson<ImplementResponseWire>('/api/seasonal/implement', {
    dry_run: dryRun,
    routes,
    cabins,
  })
  return {
    status: wire.status,
    pushed: wire.pushed,
    skipped: wire.skipped,
    log: wire.log,
    products: wire.products,
    fareItems: wire.fare_items,
  }
}

/*
 * GET /api/seasonal/implement/status → vertelt of de RAM API key server-side is
 * ingesteld. Gebruikt om de LIVE Push-knop te disablen als er geen key is.
 */
interface ImplementStatusWire {
  key_configured: boolean
}

export async function fetchImplementStatus(
  signal?: AbortSignal,
): Promise<ImplementStatus> {
  const wire = await getJson<ImplementStatusWire>(
    '/api/seasonal/implement/status',
    signal,
  )
  return { keyConfigured: Boolean(wire.key_configured) }
}
