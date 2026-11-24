import { describe, expect, it } from 'vitest'
import {
  DOCK_MAX,
  EMPTY_RUNS,
  KEPT_AFTER_CLOSE_MS,
  miniAppRuns,
  phaseOf,
  RUNNING_AFTER_MINIMIZE_MS,
  type Run,
  type RunEvent,
  type Runs,
} from './miniAppRuns'

const open = (miniAppId: string, at = 0): RunEvent => ({ kind: 'open', botId: 'chief', miniAppId, at, origin: null })
const play = (...events: RunEvent[]) => events.reduce(miniAppRuns, EMPTY_RUNS)
const runOf = (state: Runs, miniAppId: string): Run => {
  const run = state.runs.find((each) => each.miniAppId === miniAppId)
  if (!run) throw new Error(`no run of ${miniAppId}`)
  return run
}

describe('opening', () => {
  it('starts a mini app never opened from scratch, in front', () => {
    const run = runOf(play(open('a', 100)), 'a')
    expect(run).toMatchObject({ status: 'front', startedAt: 100, seenVersion: 0 })
  })

  it('minimizes the one in front when another opens', () => {
    const state = play(open('a'), open('b', 10))
    expect(runOf(state, 'a').status).toBe('docked')
    expect(runOf(state, 'b').status).toBe('front')
    expect(state.dock).toEqual(['chief/a'])
  })

  it('brings back a minimized one as it was, out of the dock', () => {
    const state = play(open('a', 1), { kind: 'loaded', key: 'chief/a', version: 3 }, open('b', 2), open('a', 3))
    expect(runOf(state, 'a')).toMatchObject({ status: 'front', startedAt: 1, seenVersion: 3 })
    expect(state.dock).toEqual(['chief/b'])
  })

  it('keeps every run where it was when one comes back, so no page is moved and reloaded', () => {
    const state = play(open('a', 1), open('b', 2), open('a', 3))
    expect(state.runs.map((run) => run.miniAppId)).toEqual(['a', 'b'])
  })

  it('starts again from scratch once a closed one has been destroyed', () => {
    const closed = play(
      open('a', 0),
      { kind: 'loaded', key: 'chief/a', version: 2 },
      { kind: 'close', key: 'chief/a', at: 0 },
    )
    expect(runOf(miniAppRuns(closed, open('a', KEPT_AFTER_CLOSE_MS - 1)), 'a').startedAt).toBe(0)
    const later = runOf(miniAppRuns(closed, open('a', KEPT_AFTER_CLOSE_MS)), 'a')
    expect(later).toMatchObject({ startedAt: KEPT_AFTER_CLOSE_MS, seenVersion: 0 })
  })
})

describe('the dock', () => {
  it('puts the latest minimized one first', () => {
    const state = play(open('a'), { kind: 'minimize', key: 'chief/a', at: 1, origin: null }, open('b', 2), {
      kind: 'minimize',
      key: 'chief/b',
      at: 3,
      origin: null,
    })
    expect(state.dock).toEqual(['chief/b', 'chief/a'])
  })

  it(`closes the oldest when more than ${DOCK_MAX} are minimized`, () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const state = play(...ids.map((id, at) => open(id, at)))
    expect(state.dock).toHaveLength(DOCK_MAX)
    expect(runOf(state, 'a').status).toBe('closed')
    expect(runOf(state, 'g').status).toBe('front')
  })

  it('takes a closed one out of the dock', () => {
    const state = play(open('a'), open('b', 1), { kind: 'close', key: 'chief/a', at: 2 })
    expect(state.dock).toEqual([])
  })
})

describe('phases', () => {
  const run = (status: Run['status']): Run => ({
    botId: 'chief',
    miniAppId: 'a',
    status,
    leftAt: 0,
    startedAt: 0,
    seenVersion: 1,
    preview: null,
    origin: null,
  })

  it('keeps a minimized one running for a while, then suspends it', () => {
    expect(phaseOf(run('docked'), RUNNING_AFTER_MINIMIZE_MS - 1)).toBe('running')
    expect(phaseOf(run('docked'), RUNNING_AFTER_MINIMIZE_MS)).toBe('suspended')
  })

  it('suspends a closed one at once and destroys it later', () => {
    expect(phaseOf(run('closed'), 0)).toBe('suspended')
    expect(phaseOf(run('closed'), KEPT_AFTER_CLOSE_MS)).toBe('destroyed')
  })
})

it('counts a version as seen only once it is newer than the newest seen', () => {
  const state = play(
    open('a'),
    { kind: 'loaded', key: 'chief/a', version: 3 },
    { kind: 'loaded', key: 'chief/a', version: 2 },
  )
  expect(runOf(state, 'a').seenVersion).toBe(3)
})

it('forgets a deleted mini app, dock included', () => {
  const state = play(open('a'), open('b', 1), { kind: 'forget', botId: 'chief', miniAppId: 'a' })
  expect(state.runs.map((each) => each.miniAppId)).toEqual(['b'])
  expect(state.dock).toEqual([])
})
