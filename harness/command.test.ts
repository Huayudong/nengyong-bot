// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { runCommand } from './command'

let dir: string
beforeEach(() => {
  dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'command-')))
  vi.stubEnv('SHELL', '/bin/sh') // the login shell is only read for PATH; the user's own one may take seconds to start
})
afterEach(() => vi.unstubAllEnvs())

it('runs the command in the given directory and returns what it printed', async () => {
  expect(await runCommand('printf hi > a.txt && cat a.txt && pwd', dir, 1000)).toBe(`hi${dir}\n`)
  expect(fs.readFileSync(path.join(dir, 'a.txt'), 'utf8')).toBe('hi')
})

it('says so when a command succeeds without printing anything', async () => {
  expect(await runCommand('true', dir, 1000)).toBe('（命令执行成功，没有输出）')
})

it('throws the exit code and the error output when the command fails', async () => {
  await expect(runCommand('echo boom >&2; exit 3', dir, 1000)).rejects.toThrow('命令失败，退出码 3：\nboom')
})

it('keeps only the start of a long output and says it was cut', async () => {
  const output = await runCommand('yes | head -c 50000', dir, 100)
  expect(output.startsWith('y\ny\n')).toBe(true)
  expect(output).toContain('输出超过 100 字')
})

it('does not wait for input that will never come', async () => {
  expect(await runCommand('cat', dir, 1000)).toBe('（命令执行成功，没有输出）')
})

it('stops the command when the task is stopped', async () => {
  const controller = new AbortController()
  const running = runCommand('sleep 10', dir, 1000, controller.signal)
  setTimeout(() => controller.abort(), 100)
  await expect(running).rejects.toThrow('命令被中止')
})

it('stops the processes the command started, not only its shell', async () => {
  const controller = new AbortController()
  const pidFile = path.join(dir, 'pid')
  const running = runCommand(`sleep 30 & echo $! > ${pidFile}; wait`, dir, 1000, controller.signal)
  await vi.waitFor(() => expect(fs.readFileSync(pidFile, 'utf8')).not.toBe(''))
  controller.abort()
  await expect(running).rejects.toThrow('命令被中止')
  const pid = Number(fs.readFileSync(pidFile, 'utf8'))
  await vi.waitFor(() => expect(() => process.kill(pid, 0)).toThrow())
})

it('does not start a command when the task was already stopped', async () => {
  await expect(runCommand('touch started', dir, 1000, AbortSignal.abort())).rejects.toThrow()
  expect(fs.existsSync(path.join(dir, 'started'))).toBe(false)
})

it('keeps tokens in the app environment away from the command', async () => {
  vi.stubEnv('GITHUB_TOKEN', 'secret-token')
  const output = await runCommand('env', dir, 10_000)
  expect(output).not.toContain('secret-token')
  expect(output).toContain('PATH=')
})
