import type { ContextView, Trace } from '../../shared/debug'

const WARN_RATIO = 0.6
const FULL_RATIO = 0.85

interface ContextTokens {
  system: number
  transcript: number
  tools: number
  total: number // the API's own count once it has one, the sum of the parts before
}

/** A context's parts in tokens, converted from their characters at the rate the API last counted. */
export function contextTokens(context: ContextView): ContextTokens {
  const tokens = (chars: number) => Math.round(chars * context.tokensPerChar)
  const system = tokens(context.sections.reduce((sum, section) => sum + section.text.length, 0))
  const transcript = tokens(context.transcript.messages.reduce((sum, message) => sum + message.text.length, 0))
  const tools = tokens(context.tools.chars)
  return { system, transcript, tools, total: context.measured?.input ?? system + transcript + tools }
}

/** The tokens a run sends right now: the input of its latest counted step, or the context it started from. */
export function liveTokens(trace: Trace | undefined, context: ContextView | null): number | undefined {
  const counted = trace?.steps.findLast((step) => step.usage)?.usage
  return counted?.input ?? (context ? contextTokens(context).total : undefined)
}

/** How much of the model's window a context takes up. */
export interface ContextFill {
  tokens: number
  windowTokens: number
}

export function fullnessOf({ tokens, windowTokens }: ContextFill): 'roomy' | 'filling' | 'full' {
  const ratio = tokens / windowTokens
  if (ratio >= FULL_RATIO) return 'full'
  return ratio >= WARN_RATIO ? 'filling' : 'roomy'
}

/** 15826 → "15.8k", 1000000 → "1M". */
export function tokensLabel(tokens: number): string {
  if (tokens >= 1_000_000) return `${Number((tokens / 1_000_000).toFixed(1))}M`
  return tokens >= 1000 ? `${Number((tokens / 1000).toFixed(1))}k` : String(tokens)
}
