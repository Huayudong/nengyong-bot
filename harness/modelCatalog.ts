import { z } from 'zod'
import type { Price } from '../shared/usage'
import BUNDLED_CATALOG from './modelCatalog.json?raw'

const REMOTE_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'
const FETCH_TIMEOUT_MS = 60_000
const GUESSED_WINDOW_TOKENS = 128_000 // a model neither catalog lists: the gauge is a guide, not a limit
const TOKENS_PER_PRICE_UNIT = 1_000_000 // the catalog prices one token; Price is per million

interface Listing {
  windowTokens?: number
  price?: Price
}

/**
 * LiteLLM's catalog of models: a copy ships with the app, so lookups need no network;
 * a model the copy does not list sends for the latest one, once per run.
 */
export function createModelCatalog(fetchLatest: () => Promise<unknown> = fetchRemote) {
  let bundled: Record<string, Listing> | undefined
  let latest: Record<string, Listing> = {}
  let hasFetched = false

  function sendForLatest() {
    hasFetched = true
    fetchLatest().then(
      (catalog) => {
        latest = listingsOf(catalog)
      },
      (error) => console.error('downloading the latest model catalog failed:', error),
    )
  }

  function lookUp<T>(model: string, pick: (listing: Listing) => T | undefined): T | undefined {
    bundled ??= listingsOf(JSON.parse(BUNDLED_CATALOG))
    const known = pick(bundled[model] ?? {}) ?? pick(latest[model] ?? {})
    if (known === undefined && !hasFetched) sendForLatest()
    return known
  }

  return {
    windowTokensOf: (model: string): number =>
      lookUp(model, (listing) => listing.windowTokens) ?? GUESSED_WINDOW_TOKENS,
    priceOf: (model: string): Price | null => lookUp(model, (listing) => listing.price) ?? null,
  }
}

async function fetchRemote(): Promise<unknown> {
  const res = await fetch(REMOTE_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`model catalog download failed (HTTP ${res.status})`)
  return res.json()
}

const Catalog = z.record(z.string(), z.unknown())
const Entry = z.object({
  max_input_tokens: z.number().int().positive().optional(),
  input_cost_per_token: z.number().nonnegative().optional(),
  cache_read_input_token_cost: z.number().nonnegative().optional(),
  output_cost_per_token: z.number().nonnegative().optional(),
})

// entries of another shape (the sample spec, whose fields are descriptions) are left out
function listingsOf(catalog: unknown): Record<string, Listing> {
  return Object.fromEntries(
    Object.entries(Catalog.parse(catalog)).flatMap(([model, entry]) => {
      const parsed = Entry.safeParse(entry)
      return parsed.success ? [[model, listingOf(parsed.data)]] : []
    }),
  )
}

function listingOf(entry: z.infer<typeof Entry>): Listing {
  const { input_cost_per_token: input, output_cost_per_token: output } = entry
  if (input === undefined || output === undefined) return { windowTokens: entry.max_input_tokens }
  const perMillion = (perToken: number) => perToken * TOKENS_PER_PRICE_UNIT
  const cached = entry.cache_read_input_token_cost ?? input
  return {
    windowTokens: entry.max_input_tokens,
    price: { input: perMillion(input), cached: perMillion(cached), output: perMillion(output) },
  }
}
