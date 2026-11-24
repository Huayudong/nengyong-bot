import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import type { Bot } from '../../shared/bot'
import { Icon } from '../ui/Icon'
import { POP } from '../ui/motion'
import { useLightDismiss } from '../ui/useLightDismiss'
import { BotAvatar } from './BotAvatar'
import { type Look, LookPicker } from './LookPicker'
import { strings } from '../../shared/strings'

interface Props {
  bot: Bot
  onPick: (look: Look) => void
}

/** The panel's avatar: pressing it opens the shape and colour picker below it, and every pick applies at once.
 * The popover may grow past the panel's padding (`cqw`: the panel is the container), not past its edge. */
export function AvatarEditor({ bot, onPick }: Props) {
  const words = strings().bot.avatar
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useLightDismiss(ref, isOpen, () => setIsOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={words.change}
        aria-expanded={isOpen}
        title={words.changeLook}
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        className="group/avatar relative grid place-items-center rounded-full bg-none"
      >
        <span className="flex transition-[filter] duration-150 group-hover/avatar:brightness-30 group-focus-visible/avatar:brightness-30 group-aria-expanded/avatar:brightness-30">
          <BotAvatar bot={bot} size={64} />
        </span>
        <span className="absolute inset-0 grid place-items-center text-side opacity-0 transition-opacity duration-150 group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100 group-aria-expanded/avatar:opacity-100">
          <Icon name="pencil" />
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label={words.changeLook}
            {...POP}
            style={{ transformOrigin: 'top center' }}
            className="absolute top-[calc(100%+6px)] left-1/2 z-10 w-[296px] max-w-[calc(100cqw+24px)] -translate-x-1/2 rounded-xl bg-surface p-3 shadow-pop"
          >
            <LookPicker compact look={{ shape: bot.shape, color: bot.color }} onPick={onPick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
