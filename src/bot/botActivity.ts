import { createContext, useContext, useEffect, useRef, useState } from 'react'

/** Transient per-bot activity driving avatar motion; absent means idle. */
export type BotActivity = 'thinking' | 'happy'

export const BotActivityContext = createContext<Record<string, BotActivity>>({})

export const useBotActivity = (botId: string) => useContext(BotActivityContext)[botId] ?? 'idle'

const HAPPY_MS = 1100 // spin + bounce reaction length

/** Owns every bot's activity: 'thinking' while a turn runs, then 'happy' for a moment, then idle. */
export function useBotActivities() {
  const [activities, setActivities] = useState<Record<string, BotActivity>>({})
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const set = (botId: string, next: BotActivity | null, onlyIf?: BotActivity) =>
    setActivities((previous) => {
      if (onlyIf && previous[botId] !== onlyIf) return previous // a newer turn already changed the state
      const { [botId]: _dropped, ...rest } = previous
      return next ? { ...rest, [botId]: next } : rest
    })

  return {
    activities,
    onBusy(botId: string, busy: boolean) {
      if (busy) return set(botId, 'thinking')
      set(botId, 'happy')
      timers.current.push(window.setTimeout(() => set(botId, null, 'happy'), HAPPY_MS))
    },
  }
}
