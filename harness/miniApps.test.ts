// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, expect, it } from 'vitest'
import type { HarnessEvent } from '../shared/bridge'
import { deleteMiniApp, miniAppHtml, miniAppTools, restoreMiniApp, saveMiniAppData } from './miniApps'
import { createStore, type Store } from './store'
import { createWorkspace, type Workspace } from './workspace'

let store: Store
let workspace: Workspace
let events: HarnessEvent[]
beforeEach(() => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mini-apps-'))
  store = createStore(path.join(dir, 'nengyongbot.db'))
  store.syncRoster([{ id: 'chief', name: '小满' }])
  workspace = createWorkspace(path.join(dir, 'library'))
  events = []
})

const context = () => ({ botId: 'chief', store, workspace, emit: (event: HarnessEvent) => events.push(event) })
type SaveInput = Parameters<NonNullable<ReturnType<typeof miniAppTools>['save_app']['execute']>>[0]

async function saveApp(input: Partial<SaveInput>) {
  const run = miniAppTools(context()).save_app.execute
  if (!run) throw new Error('save_app has no execute')
  const defaults: SaveInput = { name: '收入汇总', icon: 'chart', color: 'sky', change: '第一版', html: '<p>v</p>' }
  return run({ ...defaults, ...input }, { toolCallId: 't', messages: [], context: {} })
}

async function savedId(input: Partial<SaveInput>): Promise<string> {
  const result = await saveApp(input)
  if (!result || typeof result !== 'object' || !('saved' in result)) throw new Error('save_app returned no id')
  return String(result.saved)
}

const apps = () => store.get().bots.chief?.miniApps ?? []

it('saves a new mini app as v1 with its page and data in the library', async () => {
  const saved = await saveApp({ html: '<p>one</p>', data: '{"total":1}' })
  expect(saved).toMatchObject({ version: 1, mention: `[收入汇总](app:${apps()[0]?.id})` })
  const app = apps()[0]
  expect(app?.versions.map((each) => each.version)).toEqual([1])
  expect(fs.readFileSync(workspace.resolve(`apps/${app?.id}/v1.html`), 'utf8')).toBe('<p>one</p>')
  expect(events.map((event) => event.kind)).toEqual(['mini-apps', 'mini-app-data'])
})

it('saves a change to an existing mini app as the next version and keeps its data', async () => {
  const id = await savedId({ data: '[1]' })
  await saveApp({ id, change: '加了按月', html: '<p>two</p>' })
  const app = apps()[0]
  expect(app?.versions.map((each) => each.change)).toEqual(['第一版', '加了按月'])
  expect(miniAppHtml(store, workspace, 'chief', id, 2)).toContain('let data = [1]')
  expect(miniAppHtml(store, workspace, 'chief', id, 1)).toContain('<p>v</p>')
})

it('refuses data that is not JSON, and an id the bot does not have', async () => {
  await expect(saveApp({ data: '{oops' })).rejects.toThrow('JSON')
  await expect(saveApp({ id: 'a-missing' })).rejects.toThrow('没有 id 为 a-missing 的小程序')
  expect(apps()).toEqual([])
})

it('saves data from the page without making a new version', async () => {
  const saved = await savedId({})
  saveMiniAppData(context(), saved, { moved: true })
  expect(apps()[0]?.versions).toHaveLength(1)
  expect(apps()[0]?.dataAt).not.toBeNull()
  expect(miniAppHtml(store, workspace, 'chief', saved, 1)).toContain('{"moved":true}')
})

it('restores an old page as a new version', async () => {
  const saved = await savedId({ html: '<p>old</p>' })
  await saveApp({ id: saved, change: '改坏了', html: '<p>new</p>' })
  restoreMiniApp(context(), saved, 1)
  expect(apps()[0]?.versions.at(-1)).toMatchObject({ version: 3, change: '恢复成 v1 的样子' })
  expect(miniAppHtml(store, workspace, 'chief', saved, 3)).toContain('<p>old</p>')
})

it('deletes a mini app with its files', async () => {
  const saved = await savedId({})
  deleteMiniApp(context(), saved)
  expect(apps()).toEqual([])
  expect(fs.existsSync(workspace.resolve(`apps/${saved}`))).toBe(false)
})
