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
  ProductsResponse,
  RunPipelineArgs,
  SeasonalConfig,
  SeasonalResults,
  SeasonalSession,
  SeasonalSessionInfo,
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
 * GET /api/seasonal/sessions/{id} → resultaten van één specifieke sessie, zelfde
 * vorm als /results/latest. Dit endpoint levert de sessie-info echter onder de
 * key `session`, terwijl de rest van de app `_session` verwacht — normaliseren.
 */
interface SessionResultsWire extends SeasonalResults {
  session?: SeasonalSessionInfo
}

export async function fetchSessionResults(
  sessionId: number,
  signal?: AbortSignal,
): Promise<SeasonalResults> {
  const data = await getJson<SessionResultsWire>(
    `/api/seasonal/sessions/${sessionId}`,
    signal,
  )
  return {
    targets: data.targets,
    masks: data.masks,
    sim: data.sim,
    _session: data._session ?? data.session,
  }
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
 * De RAM API key komt nu uit de client-side API Configuration (localStorage) en
 * wordt alléén bij een LIVE push als `api_key` in de body meegestuurd; bij een
 * dry-run is apiKey leeg en valt het veld weg uit de JSON. De body bevat verder
 * dry_run (snake_case) + optionele route/cabin-filters (lege filters → de server
 * pusht alles).
 *
 * BACKEND: het Flask-endpoint moet de body-key als fallback accepteren wanneer de
 * env-var niet gezet is:
 *     api_key = os.environ.get("RAM_API_KEY", "") or data.get("api_key", "")
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
  apiKey,
}: ImplementArgs): Promise<ImplementResult> {
  const wire = await postJson<ImplementResponseWire>('/api/seasonal/implement', {
    dry_run: dryRun,
    routes,
    cabins,
    api_key: apiKey,
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
 * POST /api/seasonal/implement/targets → dry-runt of pusht de berekende targets
 * naar RAM. Zelfde api_key-flow als implementFares: alleen bij een live push
 * meegestuurd als `api_key`.
 *
 * BACKEND: idem — env-var met body-fallback:
 *     api_key = os.environ.get("RAM_API_KEY", "") or data.get("api_key", "")
 *
 * Wire-format verschilt licht per modus: dry-run levert `products`, een live push
 * `pushed` + `batchId`. We mappen naar ImplementResult met 0-defaults zodat de
 * verplichte velden altijd gevuld zijn.
 */
interface PushTargetsWire {
  status: 'dry_run' | 'ok' | 'error'
  pushed?: number
  skipped?: number
  products?: number
  batchId?: string
  log?: string[]
}

export async function pushTargets({
  routes,
  cabins,
  dryRun = true,
  apiKey,
}: ImplementArgs): Promise<ImplementResult> {
  const wire = await postJson<PushTargetsWire>('/api/seasonal/implement/targets', {
    dry_run: dryRun,
    routes,
    cabins,
    api_key: apiKey,
  })
  return {
    status: wire.status,
    pushed: wire.pushed ?? 0,
    skipped: wire.skipped ?? 0,
    log: wire.log ?? [],
    products: wire.products,
    batchId: wire.batchId,
  }
}
