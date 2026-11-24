import { useEffect, useEffectEvent } from 'react'

/** While `isActive`, keys pressed anywhere in the window go to `onKeyDown`, except those typed into a field or a dialog. */
export function useKeyDown(isActive: boolean, onKeyDown: (event: KeyboardEvent) => void) {
  const handle = useEffectEvent(onKeyDown)

  useEffect(() => {
    if (!isActive) return
    const listener = (event: KeyboardEvent) => {
      const isTaken =
        event.target instanceof Element && event.target.closest('input, textarea, [contenteditable], dialog')
      if (!isTaken) handle(event)
    }
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [isActive])
}
