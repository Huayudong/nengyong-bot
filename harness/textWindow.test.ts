import { expect, it } from 'vitest'
import { clip, textWindow } from './textWindow'

const WINDOW = 20_000

it('returns a short text unchanged', () => {
  expect(textWindow('短内容', 0, WINDOW)).toBe('短内容')
})

it('hands over only the first window of a long text and says where to read on', () => {
  const out = textWindow('a'.repeat(25_000), 0, WINDOW)
  expect(out.startsWith('a'.repeat(20_000))).toBe(true)
  expect(out).not.toContain('a'.repeat(20_001))
  expect(out).toContain('第 1–20000 字，共 25000 字；要看后面，用 offset=20000 再读')
})

it('reads on from an offset and says when the end is reached', () => {
  const out = textWindow(`${'a'.repeat(20_000)}${'b'.repeat(5_000)}`, 20_000, WINDOW)
  expect(out.startsWith('b'.repeat(5_000))).toBe(true)
  expect(out).toContain('第 20001–25000 字，共 25000 字，已到结尾')
})

it('refuses an offset past the end, telling how long the text is', () => {
  expect(() => textWindow('abc', 3, WINDOW)).toThrow('offset 超出范围：全文共 3 字')
})

it('never ends a window on half of an emoji', () => {
  const out = textWindow(`${'a'.repeat(19_999)}😀${'b'.repeat(10)}`, 0, WINDOW)
  expect(out.startsWith(`${'a'.repeat(19_999)}\n`)).toBe(true)
  expect(out).toContain('用 offset=19999 再读')
})

it('clips a text to a length without splitting an emoji', () => {
  expect(clip('abc', 5)).toBe('abc')
  expect(clip('abcdef', 3)).toBe('abc')
  expect(clip('ab😀c', 3)).toBe('ab')
})
