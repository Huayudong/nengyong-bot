import { type RefObject, useEffect, useEffectEvent } from 'react'

/** While `isOpen`, a press outside `ref` or Esc calls `onDismiss`: how a popover closes. */
export function useLightDismiss(ref: RefObject<HTMLElement | null>, isOpen: boolean, onDismiss: () => void) {
  const dismiss = useEffectEvent(onDismiss)

  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) dismiss()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.isComposing) dismiss()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, ref])
}
