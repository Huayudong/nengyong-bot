import { afterEach, expect, it, vi } from 'vitest'
import type { HarnessEvent } from '../../shared/bridge'
import { createDemoBridge } from './demoBridge'

afterEach(() => vi.useRealTimers())

it('answers a message with the user entry, busy, a fixed reply and idle, in that order', async () => {
  vi.useFakeTimers()
  const bridge = createDemoBridge()
  const events: HarnessEvent[] = []
  bridge.onEvent((event) => events.push(event))

  const sent = bridge.send('ideas', '记一下', [], null, null)
  await vi.runAllTimersAsync()
  await sent

  expect(
    events.flatMap((event): (string | boolean)[] => {
      if (event.kind === 'entry') return [event.entry.kind]
      return event.kind === 'busy' ? [event.busy] : []
    }),
  ).toEqual(['user', true, 'bot', false])
  expect((await bridge.history('ideas')).at(-1)).toMatchObject({ kind: 'bot', text: expect.stringContaining('收到') })
})

it('reports the demo turn to debug mode as it goes, ending once the reply is in', async () => {
  vi.useFakeTimers()
  const bridge = createDemoBridge()
  const traces: HarnessEvent[] = []
  bridge.onEvent((event) => event.kind === 'trace' && traces.push(event))

  const sent = bridge.send('ideas', '记一下', [], null, null)
  await vi.runAllTimersAsync()
  await sent

  expect(traces.at(-1)).toMatchObject({ trace: { id: 'ideas', finishReason: 'stop', steps: [{}, {}] } })
})
