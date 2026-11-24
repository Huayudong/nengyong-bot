import { useMemo } from 'react'
import type { Bot } from '../../shared/bot'
import type { Entry } from '../../shared/bridge'
import { trustOf } from '../../shared/trust'
import { BotAvatar } from '../bot/BotAvatar'

/** The chat's title on a phone, in place of the island: a phone has an island of its own right above it. */
export function PhoneTitle({ bot, entries }: { bot: Bot; entries: Entry[] }) {
  const { level } = useMemo(() => trustOf(entries), [entries])
  return (
    <span className="flex h-[30px] items-center gap-1.5 rounded-full bg-surface/90 pr-2.5 pl-1 shadow-card backdrop-blur-md">
      <BotAvatar bot={bot} size={22} />
      <b className="max-w-[150px] truncate text-md font-semibold">{bot.name}</b>
      <span className="shrink-0 rounded-sm bg-bubble px-1.5 text-xs font-semibold text-soft tabular-nums">
        Lv.{level}
      </span>
    </span>
  )
}
