// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { appFiles } from './appFiles'

let parent: string
let root: string
beforeEach(() => {
  parent = fs.mkdtempSync(path.join(os.tmpdir(), 'app-files-'))
  root = path.join(parent, 'dist')
  fs.mkdirSync(root)
  fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html>')
  fs.writeFileSync(path.join(parent, 'secret.txt'), 'secret')
})
afterEach(() => vi.unstubAllGlobals())

it('serves the built page at the root', async () => {
  const response = await appFiles(undefined, root)('/')
  expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
  expect(await response.text()).toBe('<!doctype html>')
})

it('serves nothing from outside the built files', async () => {
  expect((await appFiles(undefined, root)('/..%2Fsecret.txt')).status).toBe(404)
})

it('keeps the dev server proxy on the dev server, whatever the path', async () => {
  const fetchMock = vi.fn(async () => new Response('ok'))
  vi.stubGlobal('fetch', fetchMock)
  await appFiles('http://localhost:5199/', root)('//evil.example/x')
  expect(fetchMock).toHaveBeenCalledWith('http://localhost:5199//evil.example/x')
})
