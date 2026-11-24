import { type RefObject, useLayoutEffect, useState } from 'react'

interface Size {
  width: number
  height: number
}

export interface ElementSize extends Size {
  previous: Size | null // the size before this one; null for the first measurement
}

/** The laid-out size of `ref`, read again whenever it changes; null before the first layout. */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize | null {
  const [size, setSize] = useState<ElementSize | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () =>
      setSize((current) => ({
        width: element.offsetWidth,
        height: element.offsetHeight,
        previous: current && { width: current.width, height: current.height },
      }))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
