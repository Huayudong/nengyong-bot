import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { ModelName, Price } from '../shared/usage'

const FILE_NAME = 'prices.json'
const Prices = z.record(ModelName, Price)

/** The prices the user filled in on the 用量 page, for models the model catalog does not list; saved in `dir`. */
export function createPrices(dir: string) {
  const file = path.join(dir, FILE_NAME)
  let prices = load(file)

  return {
    get: (model: string): Price | undefined => prices.get(model),
    set(model: string, price: Price) {
      const next = new Map(prices).set(model, price)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(file, `${JSON.stringify(Object.fromEntries(next), null, 2)}\n`)
      prices = next
    },
  }
}

function load(file: string): Map<string, Price> {
  try {
    if (!fs.existsSync(file)) return new Map()
    return new Map(Object.entries(Prices.parse(JSON.parse(fs.readFileSync(file, 'utf8')))))
  } catch (error) {
    // only the 用量 page writes this file: a hand-broken one prices nothing, and the next price filled in replaces it
    console.error(`${file} unreadable, starting without filled-in prices:`, error)
    return new Map()
  }
}
