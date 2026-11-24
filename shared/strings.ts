import { currentLanguage } from './language'
import { en } from './strings/en'
import { zh } from './strings/zh'

/** The interface's words in the app's language. Read them where they are shown; outside src/, only inside functions. */
export function strings(): Strings {
  return currentLanguage() === 'en' ? en : zh
}

export type Strings = typeof zh
