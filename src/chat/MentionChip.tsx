import type { Bot } from '../../shared/bot'
import { BotAvatar } from '../bot/BotAvatar'

/** A bot named in a message: avatar and name in its colour, one line tall; the padding is taken back by the margin so it lines up with the text. A user bubble recolours `data-mention`; a selection over it in the message box greys it. */
export function MentionChip({ bot, isSelected = false }: { bot: Bot; isSelected?: boolean }) {
  return (
    <span
      data-mention=""
      data-selected={isSelected || undefined}
      className="-mx-[3px] inline-flex h-[1lh] max-w-[min(100%,220px)] min-w-0 items-center gap-1 rounded-sm px-[3px] align-top font-medium whitespace-nowrap data-selected:bg-ink/8"
      style={{ color: bot.color }}
    >
      <BotAvatar bot={bot} size={16} />
      <span className="truncate">{bot.name}</span>
    </span>
  )
}
