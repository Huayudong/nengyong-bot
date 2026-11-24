// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, expect, it, vi } from 'vitest'
import { createPrices } from './prices'

let dir: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prices-'))
})

it('keeps a filled-in price across a restart', () => {
  createPrices(dir).set('qwen-plus', { input: 0.11, cached: 0.11, output: 0.28 })
  expect(createPrices(dir).get('qwen-plus')).toEqual({ input: 0.11, cached: 0.11, output: 0.28 })
})

it('knows no price for a model nobody filled in, even one named like an object key', () => {
  expect(createPrices(dir).get('constructor')).toBeUndefined()
})

it('starts with no filled-in prices when the file was broken by hand', () => {
  fs.writeFileSync(path.join(dir, 'prices.json'), '{ not json')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(createPrices(dir).get('qwen-plus')).toBeUndefined()
})
