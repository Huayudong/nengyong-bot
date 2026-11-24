import { AnimatePresence, motion } from 'motion/react'
import type { Bot } from '../../shared/bot'
import { plainText } from '../../shared/plainText'
import { BotAvatar } from '../bot/BotAvatar'
import { POP } from '../ui/motion'
import { useAutoDismiss } from '../ui/useAutoDismiss'
import { strings } from '../../shared/strings'

const SHOWN_MS = 4000

export interface Reply {
  id: number
  bot: Bot
  text: string
}

interface Props {
  reply: Reply | undefined
  onOpen: (botId: string) => void
  onDismiss: (id: number) => void
}

/** Another bot replied while the phone shows something else: a card drops in at the top for a moment. */
export function ReplyNotice({ reply, onOpen, onDismiss }: Props) {
  useAutoDismiss(reply?.id, SHOWN_MS, onDismiss)
  return (
    <AnimatePresence>
      {reply && (
        <motion.button
          key={reply.id}
          {...POP}
          aria-label={strings().remote.newReply(reply.bot.name, plainText(reply.text))}
          onClick={() => onOpen(reply.bot.id)}
          className="fixed inset-x-2.5 top-2 z-50 flex items-center gap-2.5 rounded-2xl bg-surface/95 px-3 py-2.5 text-left shadow-pop backdrop-blur-xl"
        >
          <BotAvatar bot={reply.bot} size={32} />
          <span className="min-w-0 flex-1 text-sm leading-snug">
            <b className="block font-semibold">{reply.bot.name}</b>
            <span className="line-clamp-2 text-soft">{plainText(reply.text)}</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
