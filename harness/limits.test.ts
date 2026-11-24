// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, expect, it } from 'vitest'
import { DEFAULT_LIMITS } from '../shared/limits'
import { createLimits } from './limits'

let dir: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'limits-'))
})

const saved = () => JSON.parse(fs.readFileSync(path.join(dir, 'limits.json'), 'utf8'))

it('starts from the defaults when nothing was saved', () => {
  expect(createLimits(dir).get()).toEqual(DEFAULT_LIMITS)
})

it('writes only the values that differ from the defaults, and reads them back after a restart', () => {
  createLimits(dir).save({ ...DEFAULT_LIMITS, chatSteps: 50 })
  expect(saved()).toEqual({ chatSteps: 50 })
  expect(createLimits(dir).get()).toEqual({ ...DEFAULT_LIMITS, chatSteps: 50 })
})

it('forgets every change once the defaults are saved again', () => {
  const limits = createLimits(dir)
  limits.save({ ...DEFAULT_LIMITS, chatSteps: 50 })
  limits.save(DEFAULT_LIMITS)
  expect(saved()).toEqual({})
  expect(limits.get()).toEqual(DEFAULT_LIMITS)
})

it('refuses a value out of range and keeps the saved ones', () => {
  const limits = createLimits(dir)
  expect(() => limits.save({ ...DEFAULT_LIMITS, runningTasks: 0 })).toThrow()
  expect(limits.get()).toEqual(DEFAULT_LIMITS)
})

it('starts from the defaults when the file was broken by hand', () => {
  fs.writeFileSync(path.join(dir, 'limits.json'), '{ chatSteps: ')
  expect(createLimits(dir).get()).toEqual(DEFAULT_LIMITS)
})
