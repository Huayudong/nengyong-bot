import { useEffect, useState } from 'react'

/** The current time, read again every `intervalMs`: for labels such as "· 3 分钟" that age while they are on screen. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
