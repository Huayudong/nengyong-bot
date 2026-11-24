// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, expect, it } from 'vitest'
import { libraryFile, libraryItems } from './library'
import { createStore, type Store } from './store'
import { createWorkspace, type Workspace } from './workspace'

let dir: string
let store: Store
let workspace: Workspace
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'library-'))
  store = createStore(path.join(dir, 'nengyongbot.db'))
  workspace = createWorkspace(path.join(dir, 'library'))
})

function recordWrite(botId: string, written: string) {
  store.append(botId, { kind: 'tool', name: 'write_file', input: { path: written }, output: { written } })
}

function write(botId: string, file: string) {
  workspace.write(file, 'x')
  recordWrite(botId, file)
}

const paths = (botId = 'chief') => libraryItems(store, workspace, botId).map((item) => item.path)

it('lists each written file once, newest write first', async () => {
  write('chief', 'a.md')
  await new Promise((resolve) => setTimeout(resolve, 5))
  write('chief', 'b.md')
  await new Promise((resolve) => setTimeout(resolve, 5))
  write('chief', 'a.md')
  expect(paths()).toEqual(['a.md', 'b.md'])
})

it('skips files deleted since, failed writes, and files written outside the library', () => {
  write('chief', 'gone.md')
  fs.rmSync(path.join(workspace.root, 'gone.md'))
  store.append('chief', { kind: 'tool', name: 'write_file', output: { error: '没有写入权限' } })
  recordWrite('chief', workspace.write(path.join(dir, 'outside.md'), 'x'))
  write('chief', 'kept.md')
  expect(paths()).toEqual(['kept.md'])
})

it('tells documents and media from other files by extension', () => {
  write('chief', 'page.html')
  write('chief', 'shot.png')
  write('chief', 'notes/周报.MD')
  const kindByPath = Object.fromEntries(libraryItems(store, workspace, 'chief').map((item) => [item.path, item.kind]))
  expect(kindByPath).toEqual({ 'page.html': 'file', 'shot.png': 'media', 'notes/周报.MD': 'doc' })
})

it('opens a file in the library that no bot wrote with write_file, by its relative or absolute path', () => {
  workspace.write('copied/shot.png', 'x')
  expect(libraryFile(workspace, 'copied/shot.png').kind).toBe('media')
  expect(libraryFile(workspace, path.join(workspace.root, 'copied/shot.png')).kind).toBe('media')
})

it('refuses to open a file outside the library or one that is not there', () => {
  fs.writeFileSync(path.join(dir, 'outside.md'), 'x')
  expect(() => libraryFile(workspace, path.join(dir, 'outside.md'))).toThrow('资料库里没有这个文件')
  expect(() => libraryFile(workspace, 'missing.md')).toThrow('资料库里没有这个文件')
})

it('judges a symlinked file by its target, so a .md link to a .command is not opened', () => {
  workspace.write('run.command', 'echo hi')
  fs.symlinkSync('run.command', path.join(workspace.root, 'notes.md'))
  expect(libraryFile(workspace, 'notes.md').kind).toBe('file')
})
