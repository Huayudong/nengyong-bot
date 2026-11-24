import { expect, it } from 'vitest'
import { elapsedLabel } from './elapsedLabel'

it('says nothing for the first minute, then minutes, then hours and minutes', () => {
  expect(elapsedLabel(59_000)).toBe('')
  expect(elapsedLabel(3 * 60_000)).toBe('· 3 分钟')
  expect(elapsedLabel(125 * 60_000)).toBe('· 2 小时 5 分钟')
})
