import { expect, it } from 'vitest'
import type { Trace, TraceStep } from '../../shared/debug'
import { biggestJump, endOf, offsetLabel, stepTitle } from './traceView'

const step = (patch: Partial<TraceStep> = {}): TraceStep => ({
  startedAt: 0,
  endedAt: 1,
  calls: [],
  text: '',
  usage: null,
  ...patch,
})
const call = (name: string, outputChars = 0) => ({
  id: name,
  name,
  input: '{}',
  output: '',
  outputChars,
  isError: false,
})
const usage = (input: number) => ({ input, cached: 0, output: 0 })
const trace = (patch: Partial<Trace> = {}): Trace => ({
  id: 't1',
  title: '调研',
  startedAt: 0,
  endedAt: 10,
  maxSteps: 30,
  inputs: [],
  compaction: null,
  steps: [],
  finishReason: 'stop',
  error: null,
  usage: null,
  ...patch,
})

it('names a step by the tools it called, or by what it wrote', () => {
  expect(stepTitle(step({ calls: [call('web_search'), call('fetch_url')] }), true)).toBe('调用 web_search、fetch_url')
  expect(stepTitle(step({ text: '好' }), true)).toBe('写回复')
  expect(stepTitle(step({ text: '结论' }), false)).toBe('写结论')
  expect(stepTitle(step({ endedAt: null }), true)).toBe('思考中')
})

it('tells a run cut off by the step limit from one that finished', () => {
  expect(endOf(trace()).label).toBe('正常结束')
  expect(endOf(trace({ finishReason: 'tool-calls' }))).toEqual({ tone: 'warn', label: '步数用完' })
  expect(endOf(trace({ error: '超时' })).tone).toBe('bad')
  expect(endOf(trace({ endedAt: null })).label).toBe('进行中')
  expect(endOf(trace({ finishReason: null })).label).toBe('已停止')
})

it('points at the step whose tool results grew the next input the most', () => {
  const steps = [
    step({ usage: usage(5000) }),
    step({ calls: [call('fetch_url', 20_000)], usage: usage(6000) }),
    step({ usage: usage(20_000) }),
  ]
  expect(biggestJump(trace({ steps }))).toEqual({ step: 2, tokens: 14_000, chars: 20_000 })
})

it('says nothing when no step grew the input much', () => {
  expect(biggestJump(trace({ steps: [step({ usage: usage(5000) }), step({ usage: usage(5400) })] }))).toBeUndefined()
})

it('writes the time since the start in seconds, then in minutes', () => {
  expect([1900, 131_000].map(offsetLabel)).toEqual(['+1.9s', '+2:11'])
})
