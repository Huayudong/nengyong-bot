import { expect, it, vi } from 'vitest'
import { createModelCatalog } from './modelCatalog'

it('finds a listed model in the copy that ships with the app, without the network', () => {
  const fetchLatest = vi.fn(async () => ({}))
  expect(createModelCatalog(fetchLatest).windowTokensOf('deepseek-flash')).toBe(1_000_000)
  expect(fetchLatest).not.toHaveBeenCalled()
})

it('guesses for a model the copy does not list, and sends for the latest catalog once', async () => {
  const fetchLatest = vi.fn(async () => ({
    'brand-new-model': { max_input_tokens: 2_000_000 },
    sample_spec: { max_input_tokens: 'max input tokens, if the provider specifies it' },
  }))
  const catalog = createModelCatalog(fetchLatest)
  expect(catalog.windowTokensOf('brand-new-model')).toBe(128_000)
  await vi.waitFor(() => expect(catalog.windowTokensOf('brand-new-model')).toBe(2_000_000))
  expect(catalog.windowTokensOf('sample_spec')).toBe(128_000)
  expect(fetchLatest).toHaveBeenCalledTimes(1)
})

it('keeps guessing when the latest catalog cannot be fetched, without trying again', async () => {
  const fetchLatest = vi.fn(async () => {
    throw new Error('offline')
  })
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
  const catalog = createModelCatalog(fetchLatest)
  expect(catalog.windowTokensOf('brand-new-model')).toBe(128_000)
  await vi.waitFor(() => expect(logged).toHaveBeenCalled())
  expect(catalog.windowTokensOf('brand-new-model')).toBe(128_000)
  expect(fetchLatest).toHaveBeenCalledTimes(1)
})

it('prices a listed model per million tokens, cached input at its cache price', () => {
  const price = createModelCatalog(vi.fn(async () => ({}))).priceOf('deepseek-flash')
  expect(price?.input).toBeCloseTo(0.3)
  expect(price?.cached).toBeCloseTo(0.006)
  expect(price?.output).toBeCloseTo(1.2)
})

it('has no price for a model neither catalog lists, and sends for the latest catalog once', async () => {
  const fetchLatest = vi.fn(async () => ({ 'new-model': { input_cost_per_token: 1e-6, output_cost_per_token: 2e-6 } }))
  const catalog = createModelCatalog(fetchLatest)
  expect(catalog.priceOf('new-model')).toBeNull()
  await vi.waitFor(() => expect(catalog.priceOf('new-model')).toEqual({ input: 1, cached: 1, output: 2 }))
  expect(fetchLatest).toHaveBeenCalledTimes(1)
})
