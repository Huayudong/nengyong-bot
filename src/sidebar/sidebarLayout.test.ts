import { expect, it } from 'vitest'
import { resolveDrag, resolveKey, SidebarWidth } from './sidebarLayout'

it('follows the pointer between 260 and 392, collapses below 216 and re-expands only from 228', () => {
  expect(resolveDrag(false, 330)).toEqual({ collapsed: false, width: 330 })
  expect(resolveDrag(false, 999)).toEqual({ collapsed: false, width: 392 })
  expect(resolveDrag(false, 230)).toEqual({ collapsed: false, width: 260 }) // under the minimum, still expanded
  expect(resolveDrag(false, 215)).toEqual({ collapsed: true })
  expect(resolveDrag(true, 227)).toEqual({ collapsed: true }) // inside the dead zone
  expect(resolveDrag(true, 228)).toEqual({ collapsed: false, width: 260 })
})

it('steps with the arrow keys across the rail boundary, and jumps with Home and End', () => {
  expect(resolveKey(false, 288, 'ArrowRight')).toEqual({ collapsed: false, width: 308 })
  expect(resolveKey(true, 288, 'ArrowRight')).toEqual({ collapsed: false, width: 260 }) // out of the rail to the minimum
  expect(resolveKey(false, 260, 'ArrowLeft')).toEqual({ collapsed: true })
  expect(resolveKey(false, 288, 'Home')).toEqual({ collapsed: true })
  expect(resolveKey(true, 288, 'End')).toEqual({ collapsed: false, width: 392 })
  expect(resolveKey(false, 288, 'a')).toBeNull()
})

it('reads a stored width back inside its limits, and falls back when it is not a number', () => {
  expect([SidebarWidth.parse(99999), SidebarWidth.parse(300.4), SidebarWidth.parse('wide')]).toEqual([392, 300, 288])
})
