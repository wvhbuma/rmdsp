/*
 * Fetch-laag voor RAM API v2 findings. Bouwt bovenop de gedeelde ky-client
 * (src/api/client.ts): X-Api-Key, getypeerde ApiError, /api/v2 prefix.
 *
 * Dev-fallback: als de live API onbereikbaar is (geen base-url/key, netwerk,
 * 5xx) vallen we in DEV terug op MOCK_FINDINGS — zodat de pagina lokaal te zien
 * is via VITE_DEV_NO_AUTH zonder draaiende backend. In productie throwt het door.
 */
import { apiGet, apiPost } from '@/api/client'
import { isApiError } from '@/types/api'
import type { PagedResult } from '@/types/api'
import type {
  FindingSource,
  NotificationDto,
  RespondRequest,
} from '@/types/v2/findings'
import { MOCK_FINDINGS } from '@/mocks/findings'

export interface FindingsQuery {
  archived: boolean
  page: number
  pageSize: number
  status?: string[]
  priority?: number[]
  productId?: number
  source?: FindingSource
  sortBy?: 'createdUtc' | 'priority' | 'departureDate'
  sortDir?: 'asc' | 'desc'
}

function toSearchParams(q: FindingsQuery): string {
  const p = new URLSearchParams()
  p.set('archived', String(q.archived))
  p.set('page', String(q.page))
  p.set('pageSize', String(q.pageSize))
  if (q.productId !== undefined) p.set('productId', String(q.productId))
  if (q.source) p.set('source', q.source)
  if (q.sortBy) p.set('sortBy', q.sortBy)
  if (q.sortDir) p.set('sortDir', q.sortDir)
  for (const s of q.status ?? []) p.append('status', s)
  for (const pr of q.priority ?? []) p.append('priority', String(pr))
  return p.toString()
}

export async function listFindings(
  q: FindingsQuery,
  signal?: AbortSignal,
): Promise<PagedResult<NotificationDto>> {
  try {
    return await apiGet<PagedResult<NotificationDto>>(`findings?${toSearchParams(q)}`, { signal })
  } catch (err) {
    if (signal?.aborted) throw err
    if (import.meta.env.DEV) {
      console.warn(
        `[findings] live API onbereikbaar, dev-fallback op mock: ${
          isApiError(err) ? `${err.status} ${err.detail}` : String(err)
        }`,
      )
      return mockPage(q)
    }
    throw err
  }
}

export async function respondToFinding(
  id: number,
  body: RespondRequest,
): Promise<{ id: number; action: string }> {
  try {
    return await apiPost<{ id: number; action: string }>(`findings/${id}/respond`, body)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        `[findings] respond dev-fallback (geen backend): ${
          isApiError(err) ? `${err.status} ${err.detail}` : String(err)
        }`,
      )
      return { id, action: body.action }
    }
    throw err
  }
}

/** Filtert + pagineert de mock zodat de dev-fallback realistisch aanvoelt. */
function mockPage(q: FindingsQuery): PagedResult<NotificationDto> {
  let items = MOCK_FINDINGS.filter((f) =>
    q.archived ? f.archivedUtc !== null : f.archivedUtc === null,
  )
  if (q.status && q.status.length > 0) {
    const want = new Set(q.status.map((s) => s.toLowerCase()))
    items = items.filter((f) => {
      const cat = f.handledUtc
        ? 'handled'
        : f.snoozedUtc
          ? 'snoozed'
          : f.archivedUtc
            ? 'archived'
            : 'new'
      return want.has(cat)
    })
  }
  if (q.priority && q.priority.length > 0) {
    const want = new Set(q.priority)
    items = items.filter((f) => want.has(f.priority))
  }
  const total = items.length
  const start = (q.page - 1) * q.pageSize
  const pageItems = items.slice(start, start + q.pageSize)
  const totalPages = q.pageSize > 0 ? Math.ceil(total / q.pageSize) : 0
  return {
    items: pageItems,
    total,
    page: q.page,
    pageSize: q.pageSize,
    totalPages,
    hasNext: q.page < totalPages,
    hasPrevious: q.page > 1,
  }
}
