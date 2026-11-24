import { useEffect, useEffectEvent, useState } from 'react'

/**
 * Beats of a choreographed scene: 0 whenever `key` changes, then one more after each of `delays` (ms between beats).
 * `onBeat` runs as each beat lands, for what has to happen at that moment rather than be drawn from it.
 */
export function useTimeline(key: string, delays: readonly number[], onBeat?: (beat: number) => void): number {
  const [state, setState] = useState({ key, beat: 0 })
  const land = useEffectEvent((landedKey: string, beat: number) => {
    setState({ key: landedKey, beat })
    onBeat?.(beat)
  })

  useEffect(() => {
    let elapsed = 0
    const timers = delays.map((ms, index) => {
      elapsed += ms
      return window.setTimeout(() => land(key, index + 1), elapsed)
    })
    return () => timers.forEach(window.clearTimeout)
  }, [key, delays])

  return state.key === key ? state.beat : 0
}
