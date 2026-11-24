import { describe, expect, it } from 'vitest'
import type { Entry } from './bridge'
import { MAX_LEVEL, MESSAGES_PER_POINT, pointsOf, pointsToReach, tierOf, trustOf } from './trust'

const AT = Date.parse('2026-11-19T15:00:00+08:00')

const said = (count: number): Entry[] =>
  Array.from({ length: count }, (_, index) => ({ seq: index + 1, at: AT, kind: 'user', text: '在吗' }))
const fromOthers: Entry[] = [
  { seq: 500, at: AT, kind: 'from-bot', from: '秘书Bot', text: '帮我查一下' },
  { seq: 501, at: AT, kind: 'routine', name: '日报', text: '写日报' },
]
const taskResult = (status: 'done' | 'failed', flowId?: string): Entry => ({
  seq: 1000,
  at: AT,
  kind: 'task-result',
  taskId: 't1',
  title: '日报',
  status,
  text: '结论',
  flowId,
})
const savedFlow = (output: object): Entry => ({
  seq: 2000,
  at: AT,
  kind: 'tool',
  name: 'save_flow',
  input: { name: '日报' },
  output,
})
const NEW_FLOW = { saved: 'f1', isNew: true, mention: '[日报](flow:f1)' }
const CHANGED_FLOW = { ...NEW_FLOW, isNew: false }

describe('trustOf', () => {
  it('starts a bot with no chat at Lv.1 with nothing earned', () => {
    expect(trustOf([])).toEqual({ level: 1, points: 0, needed: 5, messages: 0, flowsSaved: 0, flowRuns: 0 })
  })

  it('earns 1 point for every 5 messages', () => {
    expect(trustOf(said(4))).toMatchObject({ level: 1, points: 0, messages: 4 })
    expect(trustOf(said(14))).toMatchObject({ level: 1, points: 2, messages: 14 })
  })

  it('counts only messages the user sent, not briefs from other bots or routines', () => {
    expect(trustOf([...said(4), ...fromOthers])).toMatchObject({ points: 0, messages: 4 })
  })

  it('earns 30 points for a flow it saved new, and nothing for changing one or failing to save', () => {
    const entries = [savedFlow(NEW_FLOW), savedFlow(CHANGED_FLOW), savedFlow({ error: '最多 30 个流程' })]
    expect(trustOf(entries)).toMatchObject({ level: 4, points: 0, flowsSaved: 1 })
  })

  it('earns 50 points the first time a flow comes back done, and 10 each time after', () => {
    const runs = [taskResult('done', 'f1'), taskResult('done', 'f1'), taskResult('done', 'f2')]
    expect(trustOf(runs)).toMatchObject({ level: 7, points: 5, flowRuns: 3 })
  })

  it('earns nothing for a task without a flow, or a flow run that failed', () => {
    expect(trustOf([taskResult('done'), taskResult('failed', 'f1')])).toMatchObject({
      level: 1,
      points: 0,
      flowRuns: 0,
    })
  })

  it('needs 5 points per level more for each level up', () => {
    expect(trustOf(said(25))).toMatchObject({ level: 2, points: 0, needed: 10 })
    expect(trustOf(said(75))).toMatchObject({ level: 3, points: 0, needed: 15 })
  })

  it('stops at the top level with nothing left to earn', () => {
    expect(trustOf(said(pointsToReach(MAX_LEVEL) * MESSAGES_PER_POINT))).toMatchObject({
      level: MAX_LEVEL,
      points: 0,
      needed: 0,
    })
  })
})

describe('pointsOf', () => {
  it('says what one entry earns its bot, given the entries before it', () => {
    expect(pointsOf(savedFlow(NEW_FLOW), [])).toBe(30)
    expect(pointsOf(taskResult('done'), [])).toBe(0)
  })

  it('earns a point on the fifth message, not the ones before', () => {
    expect(pointsOf(said(1)[0], said(3))).toBe(0)
    expect(pointsOf(said(1)[0], said(4))).toBe(1)
  })

  it('earns the first-run bonus once per flow, even after a failed run of it', () => {
    const first = taskResult('done', 'f1')
    expect(pointsOf(first, [taskResult('failed', 'f1')])).toBe(50)
    expect(pointsOf(first, [first])).toBe(10)
    expect(pointsOf(taskResult('done', 'f2'), [first])).toBe(50)
  })
})

describe('pointsToReach', () => {
  it('adds up what every level below takes', () => {
    expect([1, 2, 3, 10].map(pointsToReach)).toEqual([0, 5, 15, 225])
  })

  it('lands exactly on the start of that level', () => {
    expect(trustOf(said(pointsToReach(30) * MESSAGES_PER_POINT))).toMatchObject({ level: 30, points: 0 })
  })
})

describe('tierOf', () => {
  it('names the tier a level falls in', () => {
    expect([1, 9, 10, 59, 60, 98, 99].map((level) => tierOf(level).name)).toEqual([
      '初识',
      '初识',
      '熟络',
      '默契',
      '信赖',
      '知己',
      '满级',
    ])
  })
})
