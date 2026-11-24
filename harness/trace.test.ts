import { expect, it } from 'vitest'
import { endTrace, startTrace, traceWith } from './trace'

const start = { title: '聊天', inputs: ['用户：你好'], compaction: null }
const begun = (now = 0) =>
  traceWith(startTrace('chief', 12, start, 0), { type: 'start-step', request: {}, warnings: [] }, now)

it('records a call the model got wrong, which fails before it is ever reported as a call', () => {
  const failed = traceWith(
    begun(),
    {
      type: 'tool-error',
      toolCallId: 'c1',
      toolName: 'remember',
      input: {},
      error: new Error('参数不对'),
      dynamic: true,
    },
    5,
  )
  expect(failed.steps[0]?.calls).toEqual([
    { id: 'c1', name: 'remember', input: '', output: 'Error: 参数不对', outputChars: 11, isError: true },
  ])
})

it('keeps the paragraphs of one step apart', () => {
  const parts = [
    { type: 'text-start', id: 'a' },
    { type: 'text-delta', id: 'a', text: '第一段' },
    { type: 'text-start', id: 'b' },
    { type: 'text-delta', id: 'b', text: '第二段' },
  ] as const
  const written = parts.reduce((trace, part) => traceWith(trace, part, 1), begun())
  expect(written.steps[0]?.text).toBe('第一段\n\n第二段')
})

it('closes a step that a failure cut off, and keeps why', () => {
  const ended = endTrace(begun(3), 9, '接口挂了')
  expect(ended).toMatchObject({ endedAt: 9, error: '接口挂了', steps: [{ startedAt: 3, endedAt: 9 }] })
})

it('ignores the parts it does not record', () => {
  const trace = begun()
  expect(traceWith(trace, { type: 'reasoning-start', id: 'r' }, 2)).toBe(trace)
})
