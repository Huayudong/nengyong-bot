import { useSyncExternalStore } from 'react'

/** The window's inner width, read again on every resize. */
export function useWindowWidth(): number {
  return useSyncExternalStore(subscribe, () => window.innerWidth)
}

function subscribe(onResize: () => void) {
  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize)
}
