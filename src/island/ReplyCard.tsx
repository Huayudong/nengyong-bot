import type { Bot } from '../../shared/bot'
import { strings } from '../../shared/strings'
import { plainText } from '../../shared/plainText'
import { BotAvatar } from '../bot/BotAvatar'

interface Props {
  sender: Bot
  text: string
  onOpen: () => void
  onLater: () => void
}

/** Another bot replied while you were in this chat: who, the start of what it said, and a way over there. */
export function ReplyCard({ sender, text, onOpen, onLater }: Props) {
  return (
    <div className="flex w-[344px] gap-3 py-3.5 pr-4 pl-3.5">
      <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-white">
        <BotAvatar bot={sender} size={28} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 text-md font-semibold">
          <span className="truncate">{sender.name}</span>
          <span className="shrink-0 text-sm font-normal text-white/60">{strings().island.reply.justNow}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm leading-normal text-white/60">{plainText(text)}</p>
        <div className="mt-2.5 flex gap-2">
          <button type="button" onClick={onOpen} className="h-[30px] rounded-full bg-white px-3.5 text-sm text-black">
            {strings().island.reply.open}
          </button>
          <button type="button" onClick={onLater} className="h-[30px] rounded-full bg-white/12 px-3.5 text-sm">
            {strings().island.reply.later}
          </button>
        </div>
      </div>
    </div>
  )
}
