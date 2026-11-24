import { expect, it } from 'vitest'
import type { Run } from './miniAppRuns'
import { runStatus } from './runStatus'

const run = (status: Run['status'], seenVersion = 2): Run => ({
  botId: 'chief',
  miniAppId: 'a',
  status,
  leftAt: 0,
  startedAt: 0,
  seenVersion,
  preview: null,
  origin: null,
})

it('says how long a minimized one keeps running', () => {
  expect(runStatus(run('docked'), 2, 60_000)).toEqual({ kind: 'running', text: '收起了，4 分钟后挂起' })
})

it('says a minimized one has a newer version before anything else', () => {
  expect(runStatus(run('docked', 2), 3, 0)?.kind).toBe('update')
})

it('says how long a closed one can still come back as it was', () => {
  expect(runStatus(run('closed'), 2, 10 * 60_000)?.text).toBe('已关闭，20 分钟内重开接着用')
})

it('says nothing for the one in front', () => {
  expect(runStatus(run('front'), 2, 0)).toBeNull()
})

it('does not call a version new when the page was minimized before it loaded', () => {
  expect(runStatus(run('docked', 0), 3, 0)?.kind).toBe('running')
})
