import { useState } from 'react'
import type { Trace, TraceStep } from '../../shared/debug'
import { locale } from '../../shared/language'
import { strings } from '../../shared/strings'
import { TIMEZONE } from '../../shared/timezone'
import type { TokenCounts } from '../../shared/usage'
import { CodeBlock } from './CodeBlock'
import { tokensLabel } from './contextTokens'
import { TraceRow } from './TraceRow'
import { biggestJump, durationLabel, endOf, stepTitle } from './traceView'

interface Props {
  botId: string
  traces: Trace[] // newest first; the one with the bot's id is its chat
  windowTokens: number | undefined // unknown until the bot's context has been read
}

/** A run step by step: what it read, each call to the model with its tools, and how it ended. */
export function TraceTab({ botId, traces, windowTokens }: Props) {
  const runs = [...traces.filter((trace) => trace.id === botId), ...traces.filter((trace) => trace.id !== botId)]
  const [pickedId, setPickedId] = useState<string>()
  const [openRow, setOpenRow] = useState<string>()
  const trace = runs.find((run) => run.id === pickedId) ?? runs[0]
  if (!trace) return null
  const isChat = trace.id === botId
  const maxInput = Math.max(0, ...trace.steps.map((step) => step.usage?.input ?? 0))
  const toggle = (row: string) => setOpenRow((open) => (open === row ? undefined : row))
  const jump = biggestJump(trace)
  const words = strings().debug.trace
  const startedAt = new Date(trace.startedAt).toLocaleTimeString(locale(), { timeZone: TIMEZONE, hour12: false })

  return (
    <div>
      {runs.length > 1 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              aria-pressed={run.id === trace.id}
              onClick={() => {
                setPickedId(run.id)
                setOpenRow(undefined)
              }}
              className="flex h-7 max-w-[200px] items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-xs text-white/60 aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-black"
            >
              {run.endedAt === null && <span className="size-1.5 shrink-0 rounded-full bg-accent" />}
              <span className="truncate">{run.id === botId ? words.chat : words.task(run.title)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mx-0.5 mb-1.5 flex justify-between gap-2.5 text-xs text-white/60">
        <span className="truncate">{words.started(startedAt)}</span>
        <span className="shrink-0 font-mono tabular-nums">{words.steps(trace.steps.length, trace.maxSteps)}</span>
      </div>
      <ol className="relative before:absolute before:top-3.5 before:bottom-3.5 before:left-[61px] before:w-px before:bg-white/15">
        <TraceRow
          offsetMs={0}
          title={isChat ? words.readInputs(trace.inputs.length) : words.readBrief}
          isStep={false}
          isLive={false}
          maxInputTokens={maxInput}
          isOpen={openRow === 'inputs'}
          onToggle={() => toggle('inputs')}
        >
          {trace.inputs.length > 0 && <CodeBlock>{trace.inputs.join('\n\n')}</CodeBlock>}
        </TraceRow>
        {trace.compaction && (
          <TraceRow
            offsetMs={0}
            title={trace.compaction.folded ? words.compressed(trace.compaction.folded) : words.compressSkipped}
            meta={words.compressPending(trace.compaction.pending, trace.compaction.threshold)}
            isStep={false}
            isLive={false}
            maxInputTokens={maxInput}
          />
        )}
        {trace.steps.map((step, index) => (
          <TraceRow
            key={step.startedAt}
            offsetMs={step.startedAt - trace.startedAt}
            title={words.step(index + 1, stepTitle(step, isChat))}
            meta={stepMeta(step)}
            isStep
            isLive={step.endedAt === null}
            inputTokens={step.usage?.input}
            maxInputTokens={maxInput}
            windowTokens={windowTokens}
            durationMs={step.endedAt === null ? undefined : step.endedAt - step.startedAt}
            isOpen={openRow === `step-${index}`}
            onToggle={() => toggle(`step-${index}`)}
          >
            <StepDetail step={step} />
          </TraceRow>
        ))}
      </ol>
      {jump && (
        <p className="mt-2.5 rounded-md bg-warning/12 px-2.5 py-2 text-xs text-warning">
          <JumpNote step={jump.step} tokens={jump.tokens} chars={jump.chars} />
        </p>
      )}
      <RunEnd trace={trace} />
    </div>
  )
}

function JumpNote({ step, tokens, chars }: { step: number; tokens: number; chars: number }) {
  const grew = tokensLabel(tokens)
  const count = chars ? chars.toLocaleString(locale()) : null
  return strings().debug.trace.jump(step, grew, count)
}

function stepMeta(step: TraceStep): string | undefined {
  const failed = step.calls.find((call) => call.isError)
  if (failed) return strings().debug.trace.failedWith(failed.output ?? '')
  return step.calls[0]?.input || step.text || undefined
}

function StepDetail({ step }: { step: TraceStep }) {
  const words = strings().debug.trace
  return (
    <>
      {step.calls.map((call) => (
        <div key={call.id} className="flex flex-col gap-1">
          <span className="text-xs text-white/40">{words.argumentsTo(call.name)}</span>
          <CodeBlock>{call.input || words.none}</CodeBlock>
          <span data-error={call.isError || undefined} className="text-xs text-white/40 data-error:text-danger">
            {call.isError ? words.failed : words.result(call.outputChars.toLocaleString(locale()))}
          </span>
          <CodeBlock>{call.output ?? words.running}</CodeBlock>
        </div>
      ))}
      {step.text && (
        <>
          <span className="text-xs text-white/40">{words.wrote}</span>
          <CodeBlock>{step.text}</CodeBlock>
        </>
      )}
      {step.usage && (
        <span className="font-mono text-xs text-white/40 tabular-nums">
          <UsageLine usage={step.usage} />
        </span>
      )}
    </>
  )
}

function UsageLine({ usage }: { usage: TokenCounts }) {
  const [input, cached, output] = [usage.input, usage.cached, usage.output].map((count) =>
    count.toLocaleString(locale()),
  )
  return strings().debug.trace.usage(input, cached, output)
}

function RunEnd({ trace }: { trace: Trace }) {
  const end = endOf(trace)
  const { usage } = trace
  return (
    <div className="mx-0.5 mt-1.5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2.5 text-xs text-white/60">
      <span
        data-tone={end.tone}
        className="rounded-sm px-1.5 leading-5 font-semibold data-[tone=bad]:bg-danger/20 data-[tone=bad]:text-danger data-[tone=live]:bg-white/10 data-[tone=live]:text-white data-[tone=ok]:bg-accent/20 data-[tone=ok]:text-accent data-[tone=quiet]:bg-white/10 data-[tone=warn]:bg-warning/15 data-[tone=warn]:text-warning"
      >
        {end.label}
        {trace.finishReason && ` · ${trace.finishReason}`}
      </span>
      {trace.endedAt !== null && (
        <span className="font-mono tabular-nums">
          {durationLabel(trace.endedAt - trace.startedAt)}
          {usage && ` · ${runUsage(usage)}`}
        </span>
      )}
      {trace.error && <span className="w-full break-all text-danger">{trace.error}</span>}
    </div>
  )
}

function runUsage({ input, cached, output }: TokenCounts) {
  const percent = Math.round((cached / Math.max(1, input)) * 100)
  return strings().debug.trace.runUsage(tokensLabel(input), percent, output)
}
