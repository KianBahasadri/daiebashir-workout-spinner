import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * A small wrapper around `localStorage` that:
 * - Reads once on mount (lazy initializer)
 * - Persists on change
 * - Handles JSON parse/stringify failures gracefully
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw) as T
    } catch {
      // Corrupt value or JSON mismatch — reset to default.
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
      return defaultValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const serialized = JSON.stringify(state)
      if (serialized === undefined) {
        window.localStorage.removeItem(key)
        return
      }
      window.localStorage.setItem(key, serialized)
    } catch {
      // ignore write errors (quota exceeded, privacy mode, etc.)
    }
  }, [key, state])

  return [state, setState]
}
