/*
 * API-configuratie (RAM + Seasonal API endpoints + RAM API key), lokaal
 * opgeslagen in localStorage onder 'ram_api_config'.
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
}

const STORAGE_KEY = 'ram_api_config'

const DEFAULT_CONFIG: ApiConfig = {
  ramApiUrl: 'https://ram-api-es-prd.azurewebsites.net',
  ramApiKey: '',
  seasonalApiUrl: SEASONAL_API_BASE_URL ?? 'http://localhost:5050',
}

function isValidConfig(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.ramApiUrl === 'string' &&
    typeof v.ramApiKey === 'string' &&
    typeof v.seasonalApiUrl === 'string'
  )
}

const configStore = createPersistentStore<ApiConfig>(
  STORAGE_KEY,
  DEFAULT_CONFIG,
  isValidConfig,
)

/** Niet-reactieve lezer (bv. buiten React, of in event-handlers). */
export function getApiConfig(): ApiConfig {
  return configStore.get()
}

export function setApiConfig(config: ApiConfig): void {
  configStore.set(config)
}

/** De geconfigureerde RAM API key, of null als die (nog) leeg is. */
export function getRamApiKey(): string | null {
  const key = configStore.get().ramApiKey.trim()
  return key === '' ? null : key
}

export interface UseApiConfig {
  config: ApiConfig
  setConfig: (config: ApiConfig) => void
}

/** Reactieve hook: leest de config en her-rendert bij wijziging. */
export function useApiConfig(): UseApiConfig {
  const config = usePersistentStore(configStore)
  const setConfig = useCallback((next: ApiConfig) => configStore.set(next), [])
  return { config, setConfig }
}
