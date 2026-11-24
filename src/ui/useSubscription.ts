import { useEffect, useEffectEvent } from 'react'

/** Hands `onEvent` whatever `subscribe` reports while the component is mounted, like a bridge's events. */
export function useSubscription<T>(
  subscribe: (listener: (event: T) => void) => () => void,
  onEvent: (event: T) => void,
) {
  const handle = useEffectEvent(onEvent)

  useEffect(() => subscribe((event) => handle(event)), [subscribe])
}
