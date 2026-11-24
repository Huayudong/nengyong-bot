import { z } from 'zod'

/** The app's language: chosen in settings, or else the system's. The words of each live in shared/strings. */
export const Language = z.enum(['zh', 'en'])
export type Language = z.infer<typeof Language>

export const LANGUAGES = [
  { id: 'zh', label: '简体中文' },
  { id: 'en', label: 'English' },
] as const satisfies readonly { id: Language; label: string }[]

// each runtime sets it once it knows, before it reads any words; tests keep the Chinese
let current: Language = 'zh'

export function setLanguage(language: Language) {
  current = language
}

export const currentLanguage = () => current

/** An English count and its noun, for the English strings: 1 task, 2 tasks; give the plural when it is not an added s. */
export const plural = (count: number, noun: string, nounPlural = `${noun}s`) =>
  `${count} ${count === 1 ? noun : nounPlural}`

/** How the app's language writes dates and numbers, for toLocaleString and Intl. */
export const locale = () => (current === 'en' ? 'en-US' : 'zh-CN')

/** A system or browser locale such as zh-Hans-CN or en-US: Chinese for any Chinese, English for the rest. */
export const languageOf = (systemLocale: string): Language => (/^zh\b/i.test(systemLocale) ? 'zh' : 'en')
