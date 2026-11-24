// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, expect, it, vi } from 'vitest'
import { DEFAULT_LIMITS } from '../shared/limits'
import { createWorkspace } from './workspace'

let dir: string
beforeEach(() => {
  dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-')))
})

it('puts relative paths in the library and returns them relative', () => {
  const ws = createWorkspace(path.join(dir, 'library'))
  expect(ws.write('notes/a.md', 'hi')).toBe(path.join('notes', 'a.md'))
  expect(ws.read('notes/a.md', 0, DEFAULT_LIMITS)).toBe('hi')
  expect(ws.list()).toEqual(['notes/'])
})

it('reads and writes absolute paths outside the library and returns them absolute', () => {
  const ws = createWorkspace(path.join(dir, 'library'))
  const outside = path.join(dir, 'project', 'README.md')
  expect(ws.write(outside, 'hello')).toBe(outside)
  expect(ws.read(outside, 0, DEFAULT_LIMITS)).toBe('hello')
  expect(ws.list(path.join(dir, 'project'))).toEqual(['README.md'])
})

it('lets a relative path climb out of the library', () => {
  const ws = createWorkspace(path.join(dir, 'library'))
  expect(ws.write('../escape.md', 'x')).toBe(path.join(dir, 'escape.md'))
})

it('reads ~ as the home directory', () => {
  vi.spyOn(os, 'homedir').mockReturnValue(dir)
  const ws = createWorkspace(path.join(dir, 'library'))
  expect(ws.write('~/Desktop/a.md', 'x')).toBe(path.join(dir, 'Desktop', 'a.md'))
  expect(ws.list('~')).toContain('Desktop/')
})

it('keeps resolve, which the renderer reaches, inside the library, including through symlinks', () => {
  const ws = createWorkspace(path.join(dir, 'library'))
  expect(() => ws.resolve('../escape.md')).toThrow(/超出/)
  expect(() => ws.resolve('/etc/hosts')).toThrow(/超出/)
  fs.symlinkSync(os.tmpdir(), path.join(ws.root, 'link'))
  expect(() => ws.resolve('link/escape.md')).toThrow(/超出/)
  fs.symlinkSync(path.join(dir, 'outside', 'pwned.txt'), path.join(ws.root, 'dangling.md'))
  expect(() => ws.resolve('dangling.md')).toThrow()
})

it('reads a long file one window at a time', () => {
  const ws = createWorkspace(path.join(dir, 'library'))
  ws.write('long.md', 'a'.repeat(25_000))
  expect(ws.read('long.md', 0, DEFAULT_LIMITS)).toContain('用 offset=20000 再读')
  expect(ws.read('long.md', 20_000, DEFAULT_LIMITS)).toContain('已到结尾')
})

it('reads in windows and refuses files by the size set in the limits', () => {
  const ws = createWorkspace(path.join(dir, 'library'))
  ws.write('long.md', 'a'.repeat(1_500_000))
  const limits = { ...DEFAULT_LIMITS, readWindowChars: 1000, fileMegabytes: 1 }
  expect(() => ws.read('long.md', 0, limits)).toThrow('文件超过 1 MB，不读取：long.md')
  expect(ws.read('long.md', 0, { ...limits, fileMegabytes: 2 })).toContain('用 offset=1000 再读')
})

it('edits the one place the old text appears and leaves the rest of the file as it was', () => {
  const ws = createWorkspace(path.join(dir, 'library'))
  ws.write('spec.md', '# 规格\n口径：旧\n其余不动')
  expect(ws.edit('spec.md', '口径：旧', '口径：新 $&', DEFAULT_LIMITS)).toBe('spec.md')
  expect(ws.read('spec.md', 0, DEFAULT_LIMITS)).toBe('# 规格\n口径：新 $&\n其余不动')
})

it('refuses an edit whose old text is not in the file, without touching it', () => {
  const ws = createWorkspace(path.join(dir, 'library'))
  ws.write('spec.md', '口径：旧')
  expect(() => ws.edit('spec.md', '口径：没有', '新', DEFAULT_LIMITS)).toThrow('没有找到要替换的原文')
  expect(ws.read('spec.md', 0, DEFAULT_LIMITS)).toBe('口径：旧')
})

it('refuses an edit whose old text appears more than once, without touching it', () => {
  const ws = createWorkspace(path.join(dir, 'library'))
  ws.write('spec.md', 'v1\nv1')
  expect(() => ws.edit('spec.md', 'v1', 'v2', DEFAULT_LIMITS)).toThrow('不止一处')
  expect(ws.read('spec.md', 0, DEFAULT_LIMITS)).toBe('v1\nv1')
})
