// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, it } from 'vitest'
import { saveLanguage, savedLanguage } from './language'

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'nengyongbot-language-'))

it("uses the system's language until one is chosen", () => {
  expect(savedLanguage(tempDir(), 'en-US')).toBe('en')
})

it('keeps the chosen language over the system one', () => {
  const dir = tempDir()
  saveLanguage(dir, 'en')
  expect(savedLanguage(dir, 'zh-CN')).toBe('en')
})

it("falls back to the system's language when the file is broken", () => {
  const dir = tempDir()
  fs.writeFileSync(path.join(dir, 'language.json'), '"fr"')
  expect(savedLanguage(dir, 'zh-Hans-CN')).toBe('zh')
})

it('refuses to save a language the app does not have', () => {
  expect(() => saveLanguage(tempDir(), 'fr')).toThrow()
})
