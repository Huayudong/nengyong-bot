// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import type { HarnessEvent } from '../shared/bridge'
import { createUpdates } from './updates'

const updater = vi.hoisted(() => ({
  autoDownload: true,
  listeners: new Map<string, (info: unknown) => void>(),
  checkForUpdates: vi.fn(),
  downloadUpdate: vi.fn(),
  quitAndInstall: vi.fn(),
  on(name: string, listener: (info: unknown) => void) {
    updater.listeners.set(name, listener)
  },
}))
vi.mock('electron-updater', () => ({ autoUpdater: updater }))

const NEWER = { isUpdateAvailable: true, updateInfo: { version: '1.2.0', releaseDate: '2026-12-01T00:00:00.000Z' } }
const nextTick = () => new Promise((resolve) => setImmediate(resolve))
let events: HarnessEvent[]

beforeEach(() => {
  vi.clearAllMocks()
  events = []
})

it('reports a newer version without downloading it', async () => {
  updater.checkForUpdates.mockResolvedValue(NEWER)
  const updates = createUpdates((event) => events.push(event))
  expect(await updates.checkForUpdate()).toEqual({ version: '1.2.0', date: '2026-12-01T00:00:00.000Z', isNewer: true })
  expect(updater.autoDownload).toBe(false)
  expect(updater.downloadUpdate).not.toHaveBeenCalled()
})

it('reports the newest version when the app already runs it', async () => {
  updater.checkForUpdates.mockResolvedValue({ ...NEWER, isUpdateAvailable: false })
  const check = await createUpdates(() => {}).checkForUpdate()
  expect(check.isNewer).toBe(false)
})

it('says what to do when GitHub cannot be reached', async () => {
  updater.checkForUpdates.mockRejectedValue(new Error('net::ERR_INTERNET_DISCONNECTED'))
  await expect(createUpdates(() => {}).checkForUpdate()).rejects.toThrow('连不上 GitHub')
})

it('says where to get the new version when this copy cannot replace itself', async () => {
  updater.checkForUpdates.mockResolvedValue(null)
  await expect(createUpdates(() => {}).checkForUpdate()).rejects.toThrow('GitHub Releases')
})

it('reports the download as it goes', () => {
  createUpdates((event) => events.push(event))
  updater.listeners.get('download-progress')?.({
    percent: 42,
    transferred: 42,
    total: 100,
    delta: 1,
    bytesPerSecond: 1,
  })
  expect(events).toEqual([{ kind: 'update-progress', percent: 42, transferredBytes: 42, totalBytes: 100 }])
})

it('restarts into the new version once it has downloaded, after answering', async () => {
  updater.downloadUpdate.mockResolvedValue(['/tmp/update.zip'])
  await createUpdates(() => {}).installUpdate()
  expect(updater.quitAndInstall).not.toHaveBeenCalled()
  await nextTick()
  expect(updater.quitAndInstall).toHaveBeenCalledWith(true, true)
})

it('tells the window when installing fails after the download', () => {
  createUpdates((event) => events.push(event))
  updater.listeners.get('error')?.(new Error('Code signature did not pass validation'))
  expect(events).toEqual([{ kind: 'update-error', message: '新版本装不上，到 GitHub Releases 下载安装' }])
})

it('asks to move the app first when it runs from a read-only volume', async () => {
  updater.downloadUpdate.mockRejectedValue(new Error('Cannot update while running on a read-only volume'))
  await expect(createUpdates(() => {}).installUpdate()).rejects.toThrow('拖进「应用程序」文件夹')
})

it('stays open and says why when the download fails', async () => {
  updater.downloadUpdate.mockRejectedValue(new Error('socket hang up'))
  await expect(createUpdates(() => {}).installUpdate()).rejects.toThrow('没下载完')
  await nextTick()
  expect(updater.quitAndInstall).not.toHaveBeenCalled()
})
