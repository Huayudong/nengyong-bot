import type { ReactNode } from 'react'
import { strings } from '../../shared/strings'
import { tokensLabel } from './contextTokens'
import { durationLabel, offsetLabel } from './traceView'

const HEAVY_RATIO = 0.15 // a step sending this share of the window is coloured: that is where the context grew

interface Props {
  offsetMs: number
  title: string
  meta?: string
  isStep: boolean // a call to the model; the rows before the first one are preparation
  isLive: boolean
  inputTokens?: number
  maxInputTokens: number
  windowTokens?: number
  durationMs?: number
  isOpen?: boolean
  onToggle?: () => void
  children?: ReactNode // the detail shown when the row is open; without it the row cannot open
}

/** One line of a run's timeline: when, what, how big its input was, how long it took; opens to the raw detail. */
export function TraceRow(props: Props) {
  const {
    offsetMs,
    title,
    meta,
    isLive,
    inputTokens,
    maxInputTokens,
    windowTokens,
    durationMs,
    isOpen = false,
    children,
  } = props
  const canOpen = Boolean(children) && !isLive

  return (
    <li data-step={props.isStep || undefined} data-live={isLive || undefined} className="group">
      <button
        type="button"
        aria-expanded={canOpen ? isOpen : undefined}
        disabled={!canOpen}
        onClick={props.onToggle}
        className="flex min-h-10 w-full items-center gap-2 rounded-md py-1 pr-2 pl-1 text-left"
      >
        <span className="w-[46px] shrink-0 text-right font-mono text-xs text-white/40 tabular-nums">
          {offsetLabel(offsetMs)}
        </span>
        <span className="relative mx-0.5 size-[7px] shrink-0 rounded-full bg-white/40 ring-3 ring-black group-data-step:bg-white group-data-live:animate-pulse group-data-live:bg-accent" />
        <span className="flex min-w-0 flex-1 flex-col text-sm leading-snug">
          {isLive ? <span className="shimmer-text truncate">{title}…</span> : <span className="truncate">{title}</span>}
          {meta && !isLive && <span className="truncate font-mono text-xs text-white/40">{meta}</span>}
        </span>
        {inputTokens !== undefined && (
          <span
            title={strings().debug.trace.stepInput}
            data-heavy={(windowTokens && inputTokens / windowTokens > HEAVY_RATIO) || undefined}
            className="flex shrink-0 items-center gap-1.5 font-mono text-xs text-white/60 tabular-nums data-heavy:text-warning"
          >
            <span className="h-[3px] w-10 overflow-hidden rounded-full bg-white/15">
              <span
                className="block h-full bg-current"
                style={{ width: `${(inputTokens / Math.max(1, maxInputTokens)) * 100}%` }}
              />
            </span>
            {tokensLabel(inputTokens)}
          </span>
        )}
        <span className="w-[34px] shrink-0 text-right font-mono text-xs text-white/40 tabular-nums">
          {durationMs !== undefined && !isLive ? durationLabel(durationMs) : ''}
        </span>
      </button>
      {isOpen && canOpen && <div className="flex flex-col gap-1 pr-2 pb-2 pl-[72px]">{children}</div>}
    </li>
  )
}
