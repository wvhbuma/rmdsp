import ky, { type KyInstance, type Options } from 'ky'
import type { ApiError } from '@/types/api'

/**
 * RAM API v2 client
 * - Injects X-Api-Key header from config
 * - Throws typed ApiError on non-2xx responses
 * - Base URL from env or localStorage config
 */

function getRamApiKey(): string {
  try {
    const stored = localStorage.getItem('ram_api_config')
    if (stored) {
      const config = JSON.parse(stored) as { ramApiKey?: string }
      if (config.ramApiKey) return config.ramApiKey
    }
  } catch {
    // ignore parse errors
  }
  return import.meta.env.VITE_RAM_API_KEY ?? ''
}

function getRamApiBaseUrl(): string {
  try {
    const stored = localStorage.getItem('ram_api_config')
    if (stored) {
      const config = JSON.parse(stored) as { ramApiUrl?: string }
      if (config.ramApiUrl) return config.ramApiUrl
    }
  } catch {
    // ignore parse errors
  }
  return import.meta.env.VITE_RAM_API_BASE_URL ?? ''
}

function createRamClient(): KyInstance {
  return ky.create({
    prefixUrl: getRamApiBaseUrl() + '/api/v2',
    headers: {
      'Content-Type': 'application/json',
    },
    hooks: {
      beforeRequest: [
        (request) => {
          const key = getRamApiKey()
          if (key) request.headers.set('X-Api-Key', key)
        },
      ],
      afterResponse: [
        async (_request, _options, response) => {
          if (!response.ok) {
            let detail = `HTTP ${response.status}`
            try {
              const body = await response.clone().json() as { error?: string; message?: string }
              detail = body.error ?? body.message ?? detail
            } catch {
              // ignore parse errors
            }
            const error: ApiError = {
              status: response.status,
              detail,
              path: new URL(response.url).pathname,
            }
            throw error
          }
        },
      ],
    },
    retry: {
      limit: 1,
      statusCodes: [408, 429, 502, 503, 504],
    },
    timeout: 30_000,
  })
}

// Singleton — recreated when base URL or key changes
let _client: KyInstance | null = null

export function getRamClient(): KyInstance {
  if (!_client) _client = createRamClient()
  return _client
}

// Call this after updating config in localStorage
export function resetRamClient(): void {
  _client = null
}

// Typed GET helper
export async function apiGet<T>(path: string, options?: Options): Promise<T> {
  return getRamClient().get(path, options).json<T>()
}

// Typed POST helper
export async function apiPost<T>(path: string, json: unknown, options?: Options): Promise<T> {
  return getRamClient().post(path, { json, ...options }).json<T>()
}

// Typed PATCH helper
export async function apiPatch<T>(path: string, json: unknown, options?: Options): Promise<T> {
  return getRamClient().patch(path, { json, ...options }).json<T>()
}
