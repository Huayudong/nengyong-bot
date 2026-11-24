import { expect, it } from 'vitest'
import {
  changeOf,
  groupBy,
  KEY_OF,
  type Measured,
  type MeasuredView,
  modelColors,
  namesOf,
  segmentsOf,
} from './usageStats'

const TODAY = 20_000

const record = (patch: Partial<Measured>): Measured => ({
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
  amount: 1,
  ...patch,
})

const view = (records: Measured[], since: number | null = TODAY - 29): MeasuredView => ({
  today: TODAY,
  hour: 12,
  since,
  records,
  prices: [],
  botNames: {},
})

it('colours models in order of their amount, leaving a model with no price uncoloured', () => {
  const colors = modelColors([
    record({ model: 'cheap', amount: 1 }),
    record({ model: 'dear', amount: 5 }),
    record({ model: 'unknown', amount: null }),
  ])
  expect([...colors]).toEqual([
    ['dear', 'var(--color-series-1)'],
    ['cheap', 'var(--color-series-2)'],
  ])
})

it('gives every model past the fourth the same grey', () => {
  const colors = modelColors(['a', 'b', 'c', 'd', 'e'].map((model, index) => record({ model, amount: 10 - index })))
  expect(colors.get('e')).toBe('var(--color-muted)')
})

it("stacks the pointed-at row's spend per model first, then everyone else's, faded", () => {
  const colors = modelColors([record({ model: 'a', amount: 2 }), record({ model: 'b', amount: 1 })])
  const records = [
    record({ botId: 'chief', model: 'a', amount: 2 }),
    record({ botId: 'github', model: 'b', amount: 1 }),
  ]
  const segments = segmentsOf(records, colors, (item) => item.botId === 'github')
  expect(segments.map(({ model, amount, isFaded }) => [model, amount, isFaded])).toEqual([
    ['a', 0, false],
    ['b', 1, false],
    ['a', 2, true],
    ['b', 0, true],
  ])
})

it('lists groups with no price after the priced ones', () => {
  const groups = groupBy(
    [record({ model: 'unknown', amount: null, input: 9e6 }), record({ model: 'known', amount: 0.01 })],
    KEY_OF.model,
  )
  expect(groups.map((group) => group.key)).toEqual(['known', 'unknown'])
})

it('compares the last 7 days with the 7 before them', () => {
  const records = [record({ day: TODAY, amount: 3 }), record({ day: TODAY - 7, amount: 2 })]
  expect(changeOf(view(records), 7)).toBeCloseTo(0.5)
})

it('makes no comparison when the days before were not all recorded', () => {
  expect(changeOf(view([record({ day: TODAY, amount: 3 })], TODAY - 9), 7)).toBeNull()
})

it('names a bot no longer in the sidebar by the name it last had, with a look of its own', () => {
  const names = namesOf([], { ...view([]), botNames: { gone: '旧 Bot' } })
  expect(names.nameOf('bot', 'gone')).toBe('旧 Bot')
  expect(names.botOf('gone')).toMatchObject({ id: 'gone', name: '旧 Bot' })
})
