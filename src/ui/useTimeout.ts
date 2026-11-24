import { useEffect, useEffectEvent } from 'react'

/** Calls `onTimeout` once, `delayMs` after the component mounts. */
export function useTimeout(delayMs: number, onTimeout: () => void) {
  const fire = useEffectEvent(onTimeout)

  useEffect(() => {
    const timer = window.setTimeout(() => fire(), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])
}
