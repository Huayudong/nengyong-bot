import { afterEach, expect, it } from 'vitest'
import { languageOf, plural, setLanguage } from './language'
import { strings } from './strings'

afterEach(() => setLanguage('zh'))

it('reads the Chinese words until the language is set', () => {
  expect(strings().common.ungrouped).toBe('其他')
})

it('reads the English words once the language is English', () => {
  setLanguage('en')
  expect(strings().common.ungrouped).toBe('Other')
})

it('takes any Chinese system locale as Chinese', () => {
  expect(['zh-CN', 'zh-Hans-CN', 'zh-TW', 'zh'].map(languageOf)).toEqual(['zh', 'zh', 'zh', 'zh'])
})

it('takes every other system locale as English', () => {
  expect(['en-US', 'en-GB', 'ja-JP', 'zha', ''].map(languageOf)).toEqual(['en', 'en', 'en', 'en', 'en'])
})

it('counts an English noun in the singular only for one', () => {
  expect([plural(0, 'task'), plural(1, 'task'), plural(2, 'reply', 'replies')]).toEqual([
    '0 tasks',
    '1 task',
    '2 replies',
  ])
})
