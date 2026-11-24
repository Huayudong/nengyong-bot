// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, expect, it } from 'vitest'
import { calendarDay } from '../shared/timezone'
import type { ModelPrice } from '../shared/usage'
import { createStore, type Store } from './store'
import type { Task, UsageCall } from './types'
import { usageView } from './usage'

const NOW = Date.parse('2026-11-20T04:00:00Z') // noon in Beijing
const HOUR_MS = 3_600_000
const PRICES: Record<string, ModelPrice['price']> = {
  'deepseek-flash': { input: 0.3, cached: 0.006, output: 1.2 },
}
const priceOf = (model: string): ModelPrice => ({ model, price: PRICES[model] ?? null, isCustom: false })

let store: Store
beforeEach(() => {
  store = createStore(path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'usage-')), 'nengyongbot.db'))
  store.syncRoster([
    { id: 'chief', name: 'CEO' },
    { id: 'github', name: 'github 汇报' },
  ])
})

const call = (patch: Partial<UsageCall>): UsageCall => ({
  at: NOW - HOUR_MS,
  runId: 'run-1',
  transcriptId: 'chief',
  botId: 'chief',
  model: 'deepseek-flash',
  input: 1_000_000,
  cached: 800_000,
  output: 10_000,
  ...patch,
})

const task = (patch: Partial<Task>): Task => ({
  id: 't1',
  botId: 'github',
  requestedBy: 'github',
  source: { kind: 'chat' },
  title: '任务',
  status: 'done',
  statusText: '',
  createdAt: NOW,
  ...patch,
})

it('sums the calls of a chat turn into one run, priced with cached input at the cache price', () => {
  store.addUsage(call({}))
  store.addUsage(call({ at: NOW - HOUR_MS + 1 }))
  const [record] = usageView(store, priceOf, NOW).records
  expect(record).toMatchObject({ botId: 'chief', source: { kind: 'chat' }, runs: 1, input: 2_000_000, output: 20_000 })
  expect(record?.cost).toBeCloseTo((400_000 * 0.3 + 1_600_000 * 0.006 + 20_000 * 1.2) / 1e6)
})

it("puts a routine's calls under the routine's name and another bot's request under that bot", () => {
  store.saveTask(task({ id: 'routine-run', source: { kind: 'routine', routineId: 'r1' }, title: '每日汇报' }))
  store.saveTask(task({ id: 'asked', requestedBy: 'chief' }))
  store.addUsage(call({ runId: 'routine-run', transcriptId: 'routine-run', botId: 'github' }))
  store.addUsage(call({ runId: 'asked', transcriptId: 'asked', botId: 'github' }))
  const sources = usageView(store, priceOf, NOW).records.map((record) => record.source)
  expect(sources).toHaveLength(2)
  expect(sources).toEqual(
    expect.arrayContaining([
      { kind: 'routine', name: '每日汇报' },
      { kind: 'bot', from: 'chief' },
    ]),
  )
})

it('counts the turns of a day as runs, each chat turn once however many calls it made', () => {
  store.addUsage(call({ runId: 'a' }))
  store.addUsage(call({ runId: 'a' }))
  store.addUsage(call({ runId: 'b' }))
  expect(usageView(store, priceOf, NOW).records).toEqual([expect.objectContaining({ runs: 2 })])
})

it('counts a turn the main model summed up and another model answered once, on the model that answered', () => {
  store.addUsage(call({}))
  store.addUsage(call({ model: 'kimi-k2', at: NOW - HOUR_MS + 1 }))
  const runsByModel = Object.fromEntries(
    usageView(store, priceOf, NOW).records.map((record) => [record.model, record.runs]),
  )
  expect(runsByModel).toEqual({ 'deepseek-flash': 0, 'kimi-k2': 1 })
})

it('leaves the cost out for a model with no price, and lists every model used with its price', () => {
  store.addUsage(call({ model: 'qwen-plus' }))
  const view = usageView(store, priceOf, NOW)
  expect(view.records[0]?.cost).toBeNull()
  expect(view.prices).toEqual([{ model: 'qwen-plus', price: null, isCustom: false }])
})

it("buckets calls by Beijing's calendar, so 23:30 UTC belongs to the next day", () => {
  store.addUsage(call({ at: Date.parse('2026-11-19T23:30:00Z') }))
  expect(usageView(store, priceOf, NOW).records[0]?.day).toBe(calendarDay(NOW))
})

it("splits a day's calls by the hour on Beijing's clock they were made in, and tells the hour it is now", () => {
  store.addUsage(call({ runId: 'morning', at: Date.parse('2026-11-20T01:10:00Z') }))
  store.addUsage(call({ runId: 'late-morning', at: Date.parse('2026-11-20T03:50:00Z') }))
  const view = usageView(store, priceOf, NOW)
  expect(view.records.map((record) => record.hour).sort((a, b) => a - b)).toEqual([9, 11])
  expect(view.hour).toBe(12)
})

it('keeps to the last 30 days, and still tells when recording began', () => {
  const longAgo = NOW - 40 * 24 * HOUR_MS
  store.addUsage(call({ at: longAgo }))
  const view = usageView(store, priceOf, NOW)
  expect(view.records).toEqual([])
  expect(view.since).toBe(calendarDay(longAgo))
})

it('names a bot no longer in the sidebar by the name its brain kept', () => {
  store.addUsage(call({ botId: 'github', transcriptId: 'github' }))
  store.syncRoster([{ id: 'chief', name: 'CEO' }])
  expect(usageView(store, priceOf, NOW).botNames).toEqual({ github: 'github 汇报' })
})
