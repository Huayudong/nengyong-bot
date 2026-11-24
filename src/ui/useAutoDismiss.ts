import { useEffect, useEffectEvent } from 'react'

/** Calls `onDismiss(id)` `delayMs` after `id` shows up: for notices that go away on their own. No id, no timer. */
export function useAutoDismiss(id: number | undefined, delayMs: number, onDismiss: (id: number) => void) {
  const dismiss = useEffectEvent(onDismiss)

  useEffect(() => {
    if (id === undefined) return
    const timer = window.setTimeout(() => dismiss(id), delayMs)
    return () => window.clearTimeout(timer)
  }, [id, delayMs])
}
