/*
 * Fetch-laag voor de displacement-data.
 *
 * Strategie: als VITE_RAM_API_BASE_URL gezet is, halen we de live endpoint op.
 * Faalt dat (netwerk, 4xx/5xx, of geen base-url geconfigureerd), dan vallen we
 * terug op de lokale fixture in /public/api/displacement.json. Zo werkt de UI
 * ook in dev zonder backend, en zonder aparte mock-toggle.
 *
 * NB voor Python-achtergrond: `fetch` throwt NIET bij HTTP-foutstatus (4xx/5xx),
 * alleen bij netwerkfouten. Daarom checken we expliciet `res.ok`.
 */
import { RAM_API_BASE_URL } from '@/config/env'
import type { DisplacementResponse } from '@/types/displacement'

const LOCAL_FIXTURE = '/api/displacement.json'
const API_PATH = '/api/displacement'

async function readJson(url: string, signal?: AbortSignal): Promise<DisplacementResponse> {
  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} bij ${url}`)
  }
  return (await res.json()) as DisplacementResponse
}

export async function fetchDisplacement(
  signal?: AbortSignal,
): Promise<DisplacementResponse> {
  if (RAM_API_BASE_URL !== null) {
    try {
      return await readJson(`${RAM_API_BASE_URL}${API_PATH}`, signal)
    } catch (err) {
      // Live API onbereikbaar → fixture. Niet stilhouden: log voor de developer.
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      console.warn(
        `[displacement] live API onbereikbaar, val terug op fixture: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }
  return readJson(LOCAL_FIXTURE, signal)
}
