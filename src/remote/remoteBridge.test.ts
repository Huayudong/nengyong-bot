import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createRemoteBridge, encodeBytes } from './remoteBridge'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  // jsdom has no EventSource; these tests are about calls, so the stream never opens
  vi.stubGlobal(
    'EventSource',
    vi.fn(function eventSource() {
      return { close() {}, addEventListener() {} }
    }),
  )
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

const json = (status: number, value: unknown) =>
  new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })

it('sends the bytes of an attachment as base64', () => {
  expect(JSON.stringify([{ data: new Uint8Array([104, 105]) }], encodeBytes)).toBe('[{"data":{"$bytes":"aGk="}}]')
})

it('calls the computer with the arguments and answers with what it returns', async () => {
  fetchMock.mockResolvedValue(json(200, [{ kind: 'bot', text: '好' }]))
  const { bridge } = createRemoteBridge()
  await expect(bridge.history('chief')).resolves.toEqual([{ kind: 'bot', text: '好' }])
  const [url, init] = fetchMock.mock.lastCall ?? []
  expect(url).toBe('/api/call/history')
  expect(init?.body).toBe('["chief"]')
})

it('passes on the reason the computer gives', async () => {
  fetchMock.mockResolvedValue(json(400, { message: '没有这个 Bot' }))
  const { bridge } = createRemoteBridge()
  await expect(bridge.history('nobody')).rejects.toThrow('没有这个 Bot')
})

it('knows it was removed once the computer turns a call away', async () => {
  fetchMock.mockResolvedValue(json(401, { message: '这台设备还没连上电脑' }))
  const { bridge, connection } = createRemoteBridge()
  await expect(bridge.history('chief')).rejects.toThrow('这台设备还没连上电脑')
  expect(connection.get()).toBe('removed')
})

it('knows it is cut off when a call gets no answer', async () => {
  fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
  const { bridge, connection } = createRemoteBridge()
  await expect(bridge.history('chief')).rejects.toThrow('连不上电脑')
  expect(connection.get()).toBe('offline')
})

it('leaves the settings to the computer', async () => {
  const { bridge } = createRemoteBridge()
  await expect(bridge.getMcpConfig()).rejects.toThrow('只能在电脑上做')
  expect(fetchMock).not.toHaveBeenCalled()
})
