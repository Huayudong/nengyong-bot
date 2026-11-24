import fs from 'node:fs'
import path from 'node:path'
import { Language, languageOf } from '../shared/language'

const FILE_NAME = 'language.json'

/** The language chosen in settings, saved in `dir`; until one is chosen, the system's. */
export function savedLanguage(dir: string, systemLocale: string): Language {
  const file = path.join(dir, FILE_NAME)
  try {
    if (fs.existsSync(file)) return Language.parse(JSON.parse(fs.readFileSync(file, 'utf8')))
  } catch {
    // only the settings page writes this file: a hand-broken one falls back to the system's, and the next choice replaces it
  }
  return languageOf(systemLocale)
}

export function saveLanguage(dir: string, input: unknown): Language {
  const language = Language.parse(input)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, FILE_NAME), `${JSON.stringify(language)}\n`)
  return language
}
