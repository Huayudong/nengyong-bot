import { expect, it } from 'vitest'
import type { UsageRecord, UsageView } from '../../shared/usage'
import { periodsOf } from './periods'

const TODAY = 20_000

const view = (patch: Partial<UsageView>): UsageView => ({
  today: TODAY,
  hour: 14,
  since: TODAY - 29,
  records: [],
  prices: [],
  botNames: {},
  ...patch,
})

const record = (patch: Partial<UsageRecord>): UsageRecord => ({
  day: TODAY,
  hour: 9,
  botId: 'chief',
  source: { kind: 'chat' },
  model: 'deepseek-flash',
  input: 1000,
  cached: 0,
  output: 100,
  runs: 1,
  cost: 1,
  ...patch,
})

it('splits today into its 24 hours, counting only the ones come so far', () => {
  const { list } = periodsOf(view({}), 1)
  expect(list).toHaveLength(24)
  expect(list.filter((period) => period.isCounted).map((period) => period.id)).toEqual(
    Array.from({ length: 15 }, (_, hour) => hour),
  )
  expect(list[20]?.emptyNote).toBe('还没到')
})

it('puts a record in the hour it was made in today, and in its day over 7 days', () => {
  const made = record({ day: TODAY - 1, hour: 22 })
  expect(periodsOf(view({}), 1).idOf(made)).toBe(22)
  expect(periodsOf(view({}), 7).idOf(made)).toBe(TODAY - 1)
})

it('leaves the days before recording began out of the average', () => {
  const { list } = periodsOf(view({ since: TODAY - 2 }), 7)
  expect(list.filter((period) => period.isCounted)).toHaveLength(3)
  expect(list[0]?.emptyNote).toBe('还没开始记')
})
