import { type RefObject, useEffect, useRef } from 'react'

const NEAR_BOTTOM_PX = 40

interface StickToBottom {
  stick: () => void // back to the bottom and following, for when the user sends
  startNextAt: (top: number) => void // the next chat opens scrolled to `top` instead of the bottom, for going back
}

/**
 * Keeps `ref` scrolled to the bottom while it or what it holds changes size, unless the user has scrolled up to read.
 * A new `key` (another chat) starts at the bottom again, or where `startNextAt` asked once.
 */
export function useStickToBottom(ref: RefObject<HTMLElement | null>, key: string): StickToBottom {
  const isStuck = useRef(true)
  const lastTop = useRef(0)
  const nextStartTop = useRef<number | null>(null)

  const stick = () => {
    const element = ref.current
    isStuck.current = true
    if (element) lastTop.current = scrollToBottom(element)
  }

  const start = () => {
    const element = ref.current
    const top = nextStartTop.current
    nextStartTop.current = null
    if (!element || top === null) return stick()
    element.scrollTop = top
    lastTop.current = element.scrollTop
    isStuck.current = isNearBottom(element)
  }

  useEffect(() => {
    const element = ref.current
    if (!element) return
    // scroll events arrive a frame late, when content may have grown past our own scroll: only scrolling up lets go
    const onScroll = () => {
      const top = element.scrollTop
      isStuck.current = isNearBottom(element) || (isStuck.current && top >= lastTop.current)
      lastTop.current = top
    }
    const follow = () => {
      if (isStuck.current) lastTop.current = scrollToBottom(element)
    }
    const observer = new ResizeObserver(follow)
    observer.observe(element)
    for (const child of element.children) observer.observe(child)
    element.addEventListener('scroll', onScroll)
    return () => {
      observer.disconnect()
      element.removeEventListener('scroll', onScroll)
    }
  }, [ref])

  // biome-ignore lint/correctness/useExhaustiveDependencies: key is the trigger: a new chat starts at the bottom
  useEffect(start, [key])

  return {
    stick,
    startNextAt: (top) => {
      nextStartTop.current = top
    },
  }
}

function isNearBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= NEAR_BOTTOM_PX
}

function scrollToBottom(element: HTMLElement) {
  element.scrollTop = element.scrollHeight
  return element.scrollTop
}
