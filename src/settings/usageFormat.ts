import { locale } from '../../shared/language'
import { strings } from '../../shared/strings'
import type { Measure } from './measure'
import { isUnpricedOnly, type Totals } from './usageStats'

const DAY_MS = 86_400_000

// a calendarDay counts days from 1970-01-01, so that day's UTC midnight shows its date
const dateOf = (day: number) => new Date(day * DAY_MS)

export const dayLabel = (day: number) => strings().usage.format.day(dateOf(day))

export const weekdayLabel = (day: number) => strings().usage.format.weekday(dateOf(day))

/** A price per million tokens: two decimals, or two significant digits below ten cents ($0.006). */
export const unitPrice = (dollars: number) => `$${dollars >= 0.1 ? dollars.toFixed(2) : Number(dollars.toPrecision(2))}`

export function tokenLabel(tokens: number): string {
  if (tokens < 1e4) return Math.round(tokens).toLocaleString(locale())
  return strings().usage.format.largeTokens(tokens)
}

export function shareLabel(part: number, whole: number): string {
  if (!whole) return ''
  const share = part / whole
  return share > 0 && share < 0.01 ? '<1%' : `${Math.round(share * 100)}%`
}

/** What a row or line amounts to; tokens instead when it spent only on models with no price. */
export const valueLabel = (totals: Totals, measure: Measure) =>
  isUnpricedOnly(totals) ? strings().usage.format.tokens(tokenLabel(totals.unpriced)) : measure.format(totals.amount)
