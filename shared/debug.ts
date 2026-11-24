import type { Entry } from './bridge'
import type { TokenCounts } from './usage'

/** What debug mode shows of how a bot works: the context its chat sends, and the steps of each run. Kept in memory only. */

/** One run of the model with tools: a chat turn (id = bot id) or a task (id = task id). */
export interface Trace {
  id: string
  title: string
  startedAt: number
  endedAt: number | null // null while it runs
  maxSteps: number
  inputs: string[] // what it read first: the user's messages, a task's brief
  compaction: Compaction | null // chat turns only
  steps: TraceStep[]
  finishReason: string | null // the API's reason; null while it runs, or when it was stopped or failed
  error: string | null
  usage: TokenCounts | null // the whole run, once it ends
}

/** Before a chat turn, older entries are folded into the summary once more than `threshold` wait. */
export interface Compaction {
  pending: number // entries after the summary, this turn's inputs included
  threshold: number
  folded: number // 0 when it was not due
}

/** One call to the model and the tools it asked for. */
export interface TraceStep {
  startedAt: number
  endedAt: number | null
  calls: ToolCall[]
  text: string // what it wrote, clipped
  usage: TokenCounts | null // set when the step ends
}

interface ToolCall {
  id: string
  name: string
  input: string // JSON, clipped
  output: string | null // clipped; null while the tool runs
  outputChars: number // the whole output's length
  isError: boolean
}

/** What a bot's chat sends the model: the system prompt in its sections, the transcript after the summary, the tools. */
export interface ContextView {
  model: string
  windowTokens: number // the model's context window, from LiteLLM's catalog; a guess for a model it does not list
  sections: PromptSection[]
  transcript: { from: number; to: number; messages: ContextMessage[]; counts: Record<Entry['kind'], number> }
  tools: { definitions: ToolDefinition[]; chars: number }
  keepRecent: number // entries the summary leaves out when it folds
  compactAbove: number // it folds once more entries than this wait
  tokensPerChar: number // from the API's count of the last turn; a rough guess before the first one
  measured: TokenCounts | null // the API's count for the first step of this context; null until it runs
}

/** One transcript message's text as the model reads it; images and files are left out. */
export interface ContextMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  text: string
}

export interface ToolDefinition {
  name: string
  description: string
}

export interface PromptSection {
  heading: string | null // null for the opening lines, which have none
  text: string
}

/** The system prompt as the model reads it: each section under its own heading. */
export const joinSections = (sections: PromptSection[]) =>
  sections.map(({ heading, text }) => (heading ? `## ${heading}\n\n${text}` : text)).join('\n\n')
