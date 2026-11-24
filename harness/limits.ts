import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_LIMITS, Limits } from '../shared/limits'

const FILE_NAME = 'limits.json'

/** The 精细化配置 saved in `dir`. Only values that differ from the defaults are written, so a changed default reaches the rest. */
export function createLimits(dir: string) {
  const file = path.join(dir, FILE_NAME)
  let current = load(file)

  return {
    get: () => current,
    save(input: unknown): Limits {
      const next = Limits.parse(input)
      const defaults = new Map(Object.entries(DEFAULT_LIMITS))
      const changed = Object.fromEntries(Object.entries(next).filter(([key, value]) => defaults.get(key) !== value))
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(file, `${JSON.stringify(changed, null, 2)}\n`)
      current = next
      return next
    },
  }
}

function load(file: string): Limits {
  try {
    if (!fs.existsSync(file)) return DEFAULT_LIMITS
    return Limits.parse({ ...DEFAULT_LIMITS, ...JSON.parse(fs.readFileSync(file, 'utf8')) })
  } catch {
    return DEFAULT_LIMITS // only the settings page writes this file: a hand-broken one starts from the defaults, and the next save replaces it
  }
}
