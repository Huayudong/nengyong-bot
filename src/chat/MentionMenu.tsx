import { motion, useIsPresent } from 'motion/react'
import { BotAvatar } from '../bot/BotAvatar'
import { POP } from '../ui/motion'
import type { MentionCandidate } from './mentionCandidates'
import { strings } from '../../shared/strings'

interface Props {
  id: string
  candidates: MentionCandidate[]
  activeIndex: number
  onHover: (index: number) => void
  onPick: (candidate: MentionCandidate) => void
}

/** The bots an @ offers, above the message box: name on the left, sidebar group on the right; the pointer moves the highlight. */
export function MentionMenu({ id, candidates, activeIndex, onHover, onPick }: Props) {
  const isClosing = !useIsPresent()
  return (
    <motion.div
      id={id}
      role="listbox"
      aria-label={strings().chat.mention.menu}
      {...POP}
      inert={isClosing}
      style={{ transformOrigin: 'bottom left' }}
      className="absolute bottom-full left-9 z-10 mb-2 max-h-[320px] w-[300px] overflow-y-auto rounded-xl bg-surface p-1.5 text-md shadow-pop"
    >
      {candidates.length === 0 && <div className="px-3 py-2 text-muted">{strings().chat.mention.noMatch}</div>}
      {candidates.map((candidate, index) => (
        <button
          key={candidate.bot.id}
          id={mentionOptionId(id, index)}
          type="button"
          role="option"
          tabIndex={-1}
          aria-selected={index === activeIndex}
          onPointerMove={() => onHover(index)}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            // the default would move focus to the button, and the message box would lose its caret
            event.preventDefault()
            onPick(candidate)
          }}
          className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left"
        >
          <BotAvatar bot={candidate.bot} size={20} />
          <span className="min-w-0 flex-1 truncate">{candidate.bot.name}</span>
          {candidate.group && <span className="max-w-[40%] shrink-0 truncate text-muted">{candidate.group}</span>}
        </button>
      ))}
    </motion.div>
  )
}

export const mentionOptionId = (menuId: string, index: number) => `${menuId}-${index}`
