import type { Bot } from '../../shared/bot'
import { BotAvatar } from '../bot/BotAvatar'
import { type BotStatus, dotKindOf } from './botStatus'
import { StatusDot } from './StatusDot'

interface Props {
  bot: Bot
  size: number
  dotSize: number
  status: BotStatus
}

/** A bot's avatar with its status disc on the lower right, cut out of whatever the entry sits on. */
export function StatusAvatar({ bot, size, dotSize, status }: Props) {
  const kind = dotKindOf(status)
  const dot = kind && (
    <StatusDot
      kind={kind}
      size={dotSize}
      className="absolute -right-0.5 -bottom-0.5 ring-2 ring-side group-aria-[current=true]:ring-hover"
    />
  )
  return <BotAvatar bot={bot} size={size} badge={dot} />
}
