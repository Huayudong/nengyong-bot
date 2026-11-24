import { strings } from '../../shared/strings'
import { type ContextFill, fullnessOf, tokensLabel } from './contextTokens'

/** How much of the model's window a bot's chat fills: a short bar and the count, orange past 60%, red past 85%. */
export function ContextGauge(fill: ContextFill) {
  const { tokens, windowTokens } = fill
  const percent = Math.min(100, (tokens / windowTokens) * 100)

  return (
    <span
      data-fullness={fullnessOf(fill)}
      className="flex items-center gap-1.5 font-mono text-xs text-white/60 tabular-nums data-[fullness=filling]:text-warning data-[fullness=full]:text-danger"
    >
      <span className="h-1 w-[30px] overflow-hidden rounded-full bg-white/15">
        <span className="block h-full rounded-full bg-current" style={{ width: `${Math.max(4, percent)}%` }} />
      </span>
      <span className="sr-only">{strings().debug.tabs.context}</span>
      {tokensLabel(tokens)}
    </span>
  )
}
