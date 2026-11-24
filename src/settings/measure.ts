import { createContext } from 'react'
import { z } from 'zod'
import type { UsageRecord } from '../../shared/usage'
import { tokenLabel } from './usageFormat'
import { strings } from '../../shared/strings'

export const MEASURE_IDS = ['CNY', 'USD', 'tokens', 'runs'] as const

/** What the usage page counts: the estimated spend in yuan or dollars, the tokens, or the runs. */
export const MeasureId = z.enum(MEASURE_IDS).catch('CNY')
export type MeasureId = z.infer<typeof MeasureId>

export const CNY_PER_USD = 6.68 // mid-market rate of November 2026

export interface Measure {
  kind: 'spend' | 'tokens' | 'runs'
  label: string // in the menu, and on its button once chosen
  lead: (span: string) => string // what the range's total is called
  amountOf: (record: UsageRecord) => number | null // null: spent on a model with no price
  format: (amount: number) => string
  tick: (amount: number, step: number) => string // a label on the chart's scale
}

export const MEASURES: Record<MeasureId, Measure> = {
  CNY: spend('¥', CNY_PER_USD),
  USD: spend('$', 1),
  tokens: {
    kind: 'tokens',
    label: strings().usage.measure.tokens,
    lead: (span) => strings().usage.measure.tokensLead(span),
    amountOf: (record) => record.input + record.output,
    format: tokenLabel,
    tick: tokenLabel,
  },
  runs: {
    kind: 'runs',
    label: strings().usage.measure.runs,
    lead: (span) => strings().usage.measure.runsLead(span),
    amountOf: (record) => record.runs,
    format: (amount) => strings().usage.measure.runCount(Number(amount.toFixed(1))),
    tick: (amount) => String(amount),
  },
}

/** The measure deep in the usage page counts in, so it is not handed down through every layer. */
export const MeasureContext = createContext<Measure>(MEASURES.CNY)

/** Prices stay in dollars, as the model catalog lists them; the spend is shown in the currency of `symbol`. */
function spend(symbol: string, perDollar: number): Measure {
  return {
    kind: 'spend',
    label: strings().usage.measure.spend(symbol),
    lead: (span) => strings().usage.measure.spendLead(span),
    amountOf: (record) => (record.cost === null ? null : record.cost * perDollar),
    format: (amount) => (amount > 0 && amount < 0.01 ? `<${symbol}0.01` : `${symbol}${amount.toFixed(2)}`),
    tick: (amount, step) => {
      const decimals = Math.min(3, Math.max(step < 1 ? 2 : 0, (String(step).split('.')[1] ?? '').length))
      return `${symbol}${amount.toFixed(decimals)}`
    },
  }
}
