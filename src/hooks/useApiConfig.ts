/*
 * API-configuratie (RAM + Seasonal API endpoints + keys), lokaal opgeslagen in
 * localStorage onder 'ram_api_config'.
 *
 * Bewust client-side: de RAM API key wordt bij een LIVE push in de request body
 * meegestuurd (zie src/api/seasonal.ts). De key staat dus alléén in deze browser,
 * niet in de bundle of in env-vars.
 *
 * Reactief via de gedeelde persistentStore: de Settings-pagina schrijft, de
 * Implement-/Targets-pagina's lezen en her-renderen mee.
 */
import { useCallback } from 'react'
import {
  createPersistentStore,
  usePersistentStore,
} from '@/utils/persistentStore'
import { SEASONAL_API_BASE_URL } from '@/config/env'

export interface ApiConfig {
  ramApiUrl: string
  ramApiKey: string
  seasonalApiUrl: string
  /** Voor later gebruik (Fare Recommender Azure Function). */
  functionKey: string
}

const STORAGE_KEY = 'ram_api_config'

const DEFAULT_CONFIG: ApiConfig = {
  ramApiUrl: 'https://ram-api-es-prd.azurewebsites.net',
  ramApiKey: '',
  seasonalApiUrl: SEASONAL_API_BASE_URL ?? 'http://localhost:5050',
  functionKey: '',
}

function isValidConfig(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.ramApiUrl === 'string' &&
    typeof v.ramApiKey === 'string' &&
    typeof v.seasonalApiUrl === 'string' &&
    typeof v.functionKey === 'string'
  )
}

const configStore = createPersistentStore<ApiConfig>(
  STORAGE_KEY,
  DEFAULT_CONFIG,
  isValidConfig,
)

export interface UseApiConfig {
  getConfig: () => ApiConfig
  setConfig: (config: ApiConfig) => void
  /** true zodra de RAM API key niet leeg is. */
  hasApiKey: () => boolean
}

/** Reactieve hook: her-rendert bij elke wijziging van de config-store. */
export function useApiConfig(): UseApiConfig {
  const config = usePersistentStore(configStore)
  const getConfig = useCallback(() => config, [config])
  const setConfig = useCallback((next: ApiConfig) => configStore.set(next), [])
  const hasApiKey = useCallback(() => config.ramApiKey.trim() !== '', [config])
  return { getConfig, setConfig, hasApiKey }
}
