import { strings } from '../shared/strings'

export const ELAPSED_REFRESH_MS = 15_000

/** "· 3 分钟" once something has run for a minute; nothing before that. */
export function elapsedLabel(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return ''
  if (minutes < 60) return strings().app.time.minutes(minutes)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest) return strings().app.time.hoursMinutes(hours, rest)
  return strings().app.time.hours(hours)
}
