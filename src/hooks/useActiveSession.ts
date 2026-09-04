/*
 * Actieve seizoen-sessie, gepersisteerd in localStorage zodat een geladen seizoen
 * blijft hangen bij sidebar-navigatie (waar de ?session= URL-param wegvalt).
 *
 * Prioriteit in useSeasonalResults: 1) ?session= URL-param, 2) deze localStorage
 * waarde, 3) /results/latest. De functies zijn stabiel (useCallback) zodat ze
 * veilig in effect-deps gebruikt kunnen worden.
 */
import { useCallback } from 'react'

const STORAGE_KEY = 'seasonal_active_session'

export interface UseActiveSession {
  getActiveSession: () => number | null
  setActiveSession: (id: number | null) => void
  clearActiveSession: () => void
}

export function useActiveSession(): UseActiveSession {
  const getActiveSession = useCallback((): number | null => {
    if (typeof window === 'undefined') return null
    const val = window.localStorage.getItem(STORAGE_KEY)
    if (val === null) return null
    const n = parseInt(val, 10)
    return Number.isInteger(n) && n > 0 ? n : null
  }, [])

  const setActiveSession = useCallback((id: number | null): void => {
    if (typeof window === 'undefined') return
    if (id) window.localStorage.setItem(STORAGE_KEY, String(id))
    else window.localStorage.removeItem(STORAGE_KEY)
  }, [])

  const clearActiveSession = useCallback((): void => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { getActiveSession, setActiveSession, clearActiveSession }
}
