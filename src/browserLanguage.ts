import { Language, languageOf } from '../shared/language'

const KEY = 'nengyongbot:language'

/** The language of a page with no computer behind it, the demo or a device not yet paired: chosen in the demo, or the browser's. */
export function browserLanguage(): Language {
  try {
    return Language.catch(languageOf(navigator.language)).parse(localStorage.getItem(KEY))
  } catch {
    return languageOf(navigator.language) // storage blocked: the browser's
  }
}

export function saveBrowserLanguage(language: Language) {
  localStorage.setItem(KEY, language)
}
