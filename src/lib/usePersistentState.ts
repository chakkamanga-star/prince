'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

// useState that persists to localStorage (hydration-safe: loads after mount).
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  const loaded = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) setValue(JSON.parse(raw))
    } catch {}
    loaded.current = true
  }, [key])

  useEffect(() => {
    if (!loaded.current) return
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])

  const reset = useCallback(() => setValue(initial), [initial])
  return [value, setValue, reset] as const
}
