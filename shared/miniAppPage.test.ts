import { expect, it } from 'vitest'
import { miniAppPage } from './miniAppPage'

it('defines nengyongbot right after the head tag, before the page’s own scripts', () => {
  const page = miniAppPage('<!doctype html><html><head><title>x</title><script>run()</script></head></html>', { n: 1 })
  expect(page.startsWith('<!doctype html><html><head><script>')).toBe(true)
  expect(page.indexOf('window.nengyongbot')).toBeLessThan(page.indexOf('run()'))
  expect(page).toContain('let data = {"n":1}')
})

it('still answers pages written for Super Bot', () => {
  const page = miniAppPage('<head></head>', { n: 1 })
  const runtime = page.slice(page.indexOf('<script>') + '<script>'.length, page.indexOf('</script>'))
  const fakeWindow: Record<string, unknown> = { addEventListener: () => {}, parent: { postMessage: () => {} } }
  new Function('window', runtime)(fakeWindow)
  expect(fakeWindow.superbot).toBe(fakeWindow.nengyongbot)
  expect(fakeWindow.superbot).toMatchObject({ data: { n: 1 } })
})

it('keeps a doctype first when the page has no head or html tag', () => {
  expect(miniAppPage('<!DOCTYPE html><p>hi</p>', null).startsWith('<!DOCTYPE html><script>')).toBe(true)
})

it('puts the script first when the page is a bare fragment', () => {
  expect(miniAppPage('<p>hi</p>', null).startsWith('<script>')).toBe(true)
})

it('escapes a closing script tag inside the data so it cannot end the script', () => {
  const page = miniAppPage('<head></head>', { note: '</script><img src=x onerror=alert(1)>' })
  expect(page.match(/<\/script>/g)).toHaveLength(1)
  expect(page).toContain('\\u003c/script>')
})

it('keeps $ sequences in the data as written', () => {
  expect(miniAppPage('<head></head>', { price: "$& $' $1" })).toContain('"price":"$& $\' $1"')
})
