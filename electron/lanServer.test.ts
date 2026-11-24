// @vitest-environment node
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createDevices, type Devices } from './devices'
import { createLanServer, type LanServer } from './lanServer'
import { createPairing, type Pairing } from './pairing'

interface Reply {
  status: number
  headers: http.IncomingHttpHeaders
  body: string
}

let port: number
let devices: Devices
let pairing: Pairing
let server: LanServer
const handlers = {
  history: vi.fn(async (botId: unknown) => [{ kind: 'bot', text: `${String(botId)} 的记录` }]),
  send: vi.fn(async (..._args: unknown[]) => {}),
}
const onOnlineChange = vi.fn()

beforeEach(async () => {
  port = await freePort()
  devices = createDevices(fs.mkdtempSync(path.join(os.tmpdir(), 'lan-')))
  pairing = createPairing({ admit: (ask) => devices.add(ask, Date.now()), onChange: () => {} })
  server = createLanServer({
    port,
    devices,
    pairing,
    handlers,
    app: async () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }),
    image: async () => new Response(null, { status: 404 }),
    miniApp: () => new Response(null, { status: 404 }),
    libraryFile: async () => new Response(null, { status: 404 }),
    maxBodyBytes: () => 10_000,
    onOnlineChange,
  })
  expect(await server.listen()).toBeNull()
})
afterEach(() => server.close())

const own = () => `127.0.0.1:${port}`

function request(method: string, url: string, options: { headers?: http.OutgoingHttpHeaders; body?: string } = {}) {
  return new Promise<Reply>((resolve, reject) => {
    const outgoing = http.request(
      { host: '127.0.0.1', port, method, path: url, headers: { host: own(), ...options.headers } },
      (incoming) => {
        let body = ''
        incoming.on('data', (chunk) => (body += chunk))
        incoming.on('end', () => resolve({ status: incoming.statusCode ?? 0, headers: incoming.headers, body }))
      },
    )
    outgoing.on('error', reject)
    outgoing.end(options.body)
  })
}

const post = (url: string, value: unknown, headers: http.OutgoingHttpHeaders = {}) =>
  request('POST', url, { headers: { origin: `http://${own()}`, ...headers }, body: JSON.stringify(value) })

/** Pairs a browser the way a phone does; returns the cookie it gets. */
async function pair(): Promise<string> {
  const { id, code } = JSON.parse((await post('/api/pair', { name: 'iPhone', kind: 'phone' })).body)
  pairing.answer(id, code)
  const answer = await request('GET', `/api/pair/${id}`)
  expect(JSON.parse(answer.body)).toEqual({ status: 'allowed' })
  const [cookie] = answer.headers['set-cookie'] ?? []
  return cookie.split(';')[0]
}

it('serves the app to anyone on the network', async () => {
  const reply = await request('GET', '/')
  expect(reply.status).toBe(200)
  expect(reply.body).toBe('<!doctype html>')
})

it("keeps the app out of other sites' frames", async () => {
  expect((await request('GET', '/')).headers['x-frame-options']).toBe('DENY')
})

it('turns away a request addressed to another name, as a DNS rebinding page sends', async () => {
  const reply = await request('GET', '/api/session', { headers: { host: `evil.example:${port}` } })
  expect(reply.status).toBe(421)
})

it('tells a browser that has not paired to pair', async () => {
  expect(JSON.parse((await request('GET', '/api/session')).body)).toEqual({ kind: 'unpaired' })
})

it('refuses bridge calls from a browser that has not paired', async () => {
  const reply = await post('/api/call/history', ['chief'])
  expect(reply.status).toBe(401)
  expect(handlers.history).not.toHaveBeenCalled()
})

it('answers the calls of a browser the user let in', async () => {
  const cookie = await pair()
  expect(JSON.parse((await request('GET', '/api/session', { headers: { cookie } })).body)).toEqual({ kind: 'paired' })
  const reply = await post('/api/call/history', ['chief'], { cookie })
  expect(JSON.parse(reply.body)).toEqual([{ kind: 'bot', text: 'chief 的记录' }])
})

it('keeps the cookie away from scripts and other sites', async () => {
  const { id, code } = JSON.parse((await post('/api/pair', { name: 'iPhone', kind: 'phone' })).body)
  pairing.answer(id, code)
  const [cookie] = (await request('GET', `/api/pair/${id}`)).headers['set-cookie'] ?? []
  expect(cookie).toContain('HttpOnly')
  expect(cookie).toContain('SameSite=Strict')
})

it('refuses a call another page posts with the device cookie', async () => {
  const cookie = await pair()
  const reply = await post('/api/call/history', ['chief'], { cookie, origin: 'http://evil.example' })
  expect(reply.status).toBe(403)
})

it('refuses the methods a device may not call', async () => {
  const cookie = await pair()
  const reply = await post('/api/call/setMcpConfig', ['{}'], { cookie })
  expect(reply.status).toBe(404)
  expect(JSON.parse(reply.body).message).toBe('这件事只能在电脑上做')
})

it('refuses names every object has, which are no bridge methods', async () => {
  const cookie = await pair()
  expect((await post('/api/call/constructor', [], { cookie })).status).toBe(404)
})

it('turns the bytes of an attachment back into bytes', async () => {
  const cookie = await pair()
  await post('/api/call/send', ['chief', '', [{ name: 'a.txt', data: { $bytes: btoa('hi') } }], null, null], { cookie })
  expect(handlers.send.mock.lastCall?.[2]).toEqual([{ name: 'a.txt', data: Buffer.from('hi') }])
})

it('refuses a call larger than the attachments allow', async () => {
  const cookie = await pair()
  const reply = await post('/api/call/send', ['chief', 'x'.repeat(20_000), [], null, null], { cookie })
  expect(reply.status).toBe(413)
})

it('passes the reason a handler gives on to the device', async () => {
  const cookie = await pair()
  handlers.history.mockRejectedValueOnce(new Error('没有这个 Bot'))
  const reply = await post('/api/call/history', ['nobody'], { cookie })
  expect(reply.status).toBe(400)
  expect(JSON.parse(reply.body).message).toBe('没有这个 Bot')
})

it('streams a device only the events meant for devices', async () => {
  const cookie = await pair()
  const received = await new Promise<string>((resolve) => {
    http.get({ host: '127.0.0.1', port, path: '/api/events', headers: { host: own(), cookie } }, (incoming) => {
      let text = ''
      incoming.on('data', (chunk) => {
        text += chunk
        if (text.includes('"entry"')) {
          incoming.destroy()
          resolve(text)
        }
      })
      server.broadcast({ kind: 'open-settings' })
      server.broadcast({ kind: 'pairing', request: null })
      server.broadcast({ kind: 'entry', botId: 'chief', entry: { kind: 'bot', seq: 1, at: 0, text: '好' } })
    })
  })
  const kinds = [...received.matchAll(/^data: (.+)$/gm)].map((match) => JSON.parse(match[1]).kind)
  expect(kinds).toEqual(['entry'])
})

it('shows a device as online while its stream is open', async () => {
  const cookie = await pair()
  await new Promise<void>((resolve) => {
    http.get({ host: '127.0.0.1', port, path: '/api/events', headers: { host: own(), cookie } }, (incoming) => {
      incoming.once('data', () => {
        expect(server.onlineIds().size).toBe(1)
        incoming.destroy()
        resolve()
      })
    })
  })
  expect(onOnlineChange).toHaveBeenCalled()
})

it('turns a removed device away', async () => {
  const cookie = await pair()
  const [device] = devices.views(new Set())
  devices.remove(device.id)
  server.drop(device.id)
  expect((await post('/api/call/history', ['chief'], { cookie })).status).toBe(401)
})

it('says the port is taken when another program holds it', async () => {
  const second = createLanServer({
    port,
    devices,
    pairing,
    handlers,
    app: async () => new Response(null),
    image: async () => new Response(null),
    miniApp: () => new Response(null),
    libraryFile: async () => new Response(null),
    maxBodyBytes: () => 0,
    onOnlineChange,
  })
  expect(await second.listen()).toBe(`端口 ${port} 被别的程序占用了`)
})

function freePort() {
  return new Promise<number>((resolve) => {
    const probe = net.createServer().listen(0, () => {
      const address = probe.address()
      probe.close(() => resolve(typeof address === 'object' && address ? address.port : 0))
    })
  })
}
