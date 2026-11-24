import { useEffect, useState } from 'react'
import type { z } from 'zod'

const PREFIX = 'nengyongbot:'

/** useState that survives reloads. The schema turns whatever is stored (possibly stale or tampered) into a valid value: give it a `.catch()` default. */
export function usePersistentState<T>(key: string, schema: z.ZodType<T>) {
  const [value, setValue] = useState<T>(() => schema.parse(read(key)))
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // best-effort: quota exceeded or private mode just means state is not remembered
    }
  }, [key, value])
  return [value, setValue] as const
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined // corrupted JSON or storage blocked: fall back to defaults
  }
}
