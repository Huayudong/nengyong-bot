import { expect, it } from 'vitest'
import { newId, timeOfId } from './newId'

it('reads back the time newId put into an id', () => {
  const before = Date.now()
  const at = timeOfId(newId('b'), 'b')
  expect(at).toBeGreaterThanOrEqual(before)
  expect(at).toBeLessThanOrEqual(Date.now())
})

it('finds no time in an id newId did not make', () => {
  expect(timeOfId('chief', 'b')).toBeUndefined()
  expect(timeOfId('body', 'b')).toBeUndefined()
  expect(timeOfId(newId('t'), 'b')).toBeUndefined()
})
