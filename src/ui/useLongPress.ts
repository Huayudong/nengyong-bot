import type { PointerEvent } from 'react'
import { useState } from 'react'
import { useAutoDismiss } from './useAutoDismiss'

const LONG_PRESS_MS = 450
const MOVE_TOLERANCE_PX = 4 // further, and the pointer is selecting text

/**
 * Holding the pointer still on the element for LONG_PRESS_MS calls `onLongPress`, while the press goes on: dragging
 * after it still reaches the rows below. `isPressing` is true while the press is held, for the element to show it.
 */
export function useLongPress(onLongPress: () => void) {
  const [press, setPress] = useState<{ id: number; x: number; y: number } | null>(null)
  useAutoDismiss(press?.id, LONG_PRESS_MS, () => {
    setPress(null)
    window.getSelection()?.removeAllRanges()
    onLongPress()
  })
  const cancel = () => setPress(null)

  return {
    isPressing: press !== null,
    handlers: {
      onPointerDown(event: PointerEvent) {
        const isOnControl = event.target instanceof Element && event.target.closest('a, button')
        if (event.button !== 0 || isOnControl) return
        setPress({ id: event.timeStamp, x: event.clientX, y: event.clientY })
      },
      onPointerMove(event: PointerEvent) {
        if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > MOVE_TOLERANCE_PX) cancel()
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
    },
  }
}
