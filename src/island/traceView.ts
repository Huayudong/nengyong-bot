import type { Trace, TraceStep } from '../../shared/debug'
import { strings } from '../../shared/strings'

const JUMP_TOKENS = 8000 // a step that adds this much to the next one's input is worth pointing out

/** What a step did, as the timeline names it. */
export function stepTitle(step: TraceStep, isChat: boolean): string {
  const words = strings().debug.trace
  const names = step.calls.map((call) => call.name)
  if (names.length) return words.calls(names)
  if (step.text) return isChat ? words.writeReply : words.writeConclusion
  return step.endedAt === null ? words.thinking : words.thought
}

/** How a run ended, for the line under the timeline. */
export function endOf(trace: Trace): { tone: 'live' | 'ok' | 'warn' | 'bad' | 'quiet'; label: string } {
  const ends = strings().debug.trace.ends
  if (trace.endedAt === null) return { tone: 'live', label: ends.running }
  if (trace.error) return { tone: 'bad', label: ends.error }
  switch (trace.finishReason) {
    case 'stop':
      return { tone: 'ok', label: ends.finished }
    case 'tool-calls':
      return { tone: 'warn', label: ends.outOfSteps }
    case 'length':
      return { tone: 'warn', label: ends.cutOff }
    case 'content-filter':
      return { tone: 'bad', label: ends.blocked }
    case null:
      return { tone: 'quiet', label: ends.stopped }
    default:
      return { tone: 'quiet', label: ends.other }
  }
}

/** The step whose results grew the next step's input the most, when that is big enough to matter. */
export function biggestJump(trace: Trace): { step: number; tokens: number; chars: number } | undefined {
  const jumps = trace.steps.flatMap((step, index) => {
    const before = step.usage?.input
    const after = trace.steps[index + 1]?.usage?.input
    if (before === undefined || after === undefined) return []
    const chars = step.calls.reduce((sum, call) => sum + call.outputChars, 0)
    return [{ step: index + 1, tokens: after - before, chars }]
  })
  const biggest = jumps.reduce<(typeof jumps)[number] | undefined>(
    (best, jump) => (jump.tokens > (best?.tokens ?? 0) ? jump : best),
    undefined,
  )
  return biggest && biggest.tokens >= JUMP_TOKENS ? biggest : undefined
}

/** Milliseconds since the run started: "+1.9s", "+2:11" past a minute. */
export function offsetLabel(ms: number): string {
  const seconds = ms / 1000
  if (seconds < 60) return `+${seconds.toFixed(1)}s`
  return `+${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

export const durationLabel = (ms: number) => `${(ms / 1000).toFixed(1)}s`
