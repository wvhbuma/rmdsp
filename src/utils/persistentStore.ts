/*
 * Mini external store met localStorage-persistentie, bedoeld voor app-brede
 * preferences die door meerdere componenten tegelijk gelezen/geschreven worden
 * (bv. de Preferences-pagina schrijft, de Sidebar leest).
 *
 * Waarom geen useState: useState is per-component. We willen dat een wijziging
 * in de Preferences-pagina meteen de Sidebar her-rendert. Daarom een store met
 * subscribers + React's useSyncExternalStore (de officiële API voor externe
 * stores in React 18).
 *
 * - Binnen één tab: set() notificeert alle subscribers direct.
 * - Tussen tabs: het storage-event vangt wijzigingen van andere tabs op.
 */
import { useSyncExternalStore } from 'react'

export interface PersistentStore<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

function readInitial<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    // Corrupte/onleesbare waarde → val terug op default i.p.v. crashen.
    return fallback
  }
}

export function createPersistentStore<T>(
  key: string,
  fallback: T,
): PersistentStore<T> {
  let current = readInitial(key, fallback)
  const listeners = new Set<() => void>()

  function emit() {
    for (const l of listeners) l()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return
      current = readInitial(key, fallback)
      emit()
    })
  }

  return {
    get: () => current,
    set: (next) => {
      current =
        typeof next === 'function' ? (next as (prev: T) => T)(current) : next
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(current))
        } catch {
          // Quota/private-mode: in-memory waarde blijft geldig, alleen niet
          // persistent. Bewust geen throw — de UI moet blijven werken.
        }
      }
      emit()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/** React-hook die een store leest en bij wijziging her-rendert. */
export function usePersistentStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
