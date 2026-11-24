import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { generateText } from 'ai'
import { MockLanguageModelV4 } from 'ai/test'
import { DEFAULT_LIMITS } from '../shared/limits'
import { createMcp } from './mcp'

// the smallest MCP server over stdio: one tool, `echo`, that hands back its text
const ECHO_SERVER = `
const reply = (id, body) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, ...body }) + '\\n')
require('readline').createInterface({ input: process.stdin }).on('line', (line) => {
  const { id, method, params } = JSON.parse(line)
  if (id === undefined) return
  if (method === 'initialize')
    return reply(id, { result: { protocolVersion: params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'echo', version: '1.0.0' } } })
  if (method === 'tools/list')
    return reply(id, { result: { tools: [{ name: 'echo', description: '原样返回', inputSchema: { type: 'object', properties: { text: { type: 'string' } } } }] } })
  if (method === 'tools/call') return reply(id, { result: { content: [{ type: 'text', text: params.arguments.text }] } })
  reply(id, { error: { code: -32601, message: 'Method not found' } })
})`

const echoConfig = (name: string) =>
  JSON.stringify({ mcpServers: { [name]: { command: process.execPath, args: ['-e', ECHO_SERVER] } } })

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
}

/** A model that calls one tool with the text 你好 and stops. */
const callsEcho = (toolName: string) =>
  new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: 'tool-call', toolCallId: 'c1', toolName, input: JSON.stringify({ text: '你好' }) }],
      finishReason: { unified: 'tool-calls', raw: undefined },
      usage,
      warnings: [],
    }),
  })

let dir: string
let opened: ReturnType<typeof createMcp>[]
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-'))
  opened = []
  vi.stubEnv('SHELL', '/bin/sh') // the login shell is only read for PATH; the user's own one may take seconds to start
})
afterEach(async () => {
  await Promise.all(opened.map((mcp) => mcp.close()))
  vi.unstubAllEnvs()
})

const open = () => {
  const mcp = createMcp(dir, () => DEFAULT_LIMITS)
  opened = [...opened, mcp]
  return mcp
}

it('connects to a local server and hands its tools to tasks, named after the server', async () => {
  const mcp = open()
  const view = await mcp.save(echoConfig('echo box'))
  expect(view.servers).toEqual([
    { kind: 'ready', name: 'echo box', tools: [{ name: 'echo', description: '原样返回' }] },
  ])
  const { servers, tools } = await mcp.toolbox()
  expect(servers).toEqual(['echo box'])
  const { toolResults } = await generateText({ model: callsEcho('echo_box__echo'), tools, prompt: '回声' })
  expect(toolResults).toMatchObject([{ output: { content: [{ type: 'text', text: '你好' }] } }])
})

it('starts from the config saved last time', async () => {
  await open().save(echoConfig('echo'))
  const later = open()
  expect(later.configured()).toEqual(['echo'])
  expect((await later.view()).servers).toEqual([
    { kind: 'ready', name: 'echo', tools: [{ name: 'echo', description: '原样返回' }] },
  ])
})

it('starts a local server in the app directory unless its config says otherwise', async () => {
  const printsCwd = `require('fs').writeFileSync('cwd.txt', process.cwd());${ECHO_SERVER}`
  await open().save(JSON.stringify({ mcpServers: { echo: { command: process.execPath, args: ['-e', printsCwd] } } }))
  expect(fs.realpathSync(fs.readFileSync(path.join(dir, 'cwd.txt'), 'utf8'))).toBe(fs.realpathSync(dir))
})

it('says how to fix a command that is not installed, and still connects the other servers', async () => {
  const config = {
    mcpServers: {
      missing: { command: 'nengyongbot-no-such-command' },
      echo: { command: process.execPath, args: ['-e', ECHO_SERVER] },
    },
  }
  const { servers } = await open().save(JSON.stringify(config))
  expect(servers).toEqual([
    { kind: 'failed', name: 'missing', message: expect.stringContaining('找不到这个命令') },
    { kind: 'ready', name: 'echo', tools: [{ name: 'echo', description: '原样返回' }] },
  ])
})

it('rejects text that is not JSON and keeps the saved config', async () => {
  const mcp = open()
  await mcp.save(echoConfig('echo'))
  await expect(mcp.save('{ "mcpServers": ')).rejects.toThrow('MCP 配置不是合法的 JSON')
  expect((await mcp.view()).text).toBe(echoConfig('echo'))
  expect(fs.readFileSync(path.join(dir, 'mcp.json'), 'utf8')).toBe(echoConfig('echo'))
})

it('shows a saved config that no longer parses as it is, so fixing it does not start from a blank one', async () => {
  const broken = '{ "mcpServers": { "echo": '
  fs.writeFileSync(path.join(dir, 'mcp.json'), broken)
  const view = await open().view()
  expect(view.text).toBe(broken)
  expect(view.servers).toEqual([{ kind: 'failed', name: 'mcp.json', message: expect.stringContaining('JSON') }])
})

it('rejects a server with neither a command nor a url', async () => {
  await expect(open().save('{ "mcpServers": { "x": {} } }')).rejects.toThrow('要么写 command（本机程序），要么写 url')
})
