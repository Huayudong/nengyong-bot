import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { EASE_SWIFT } from '../ui/motion'
import { useAutoDismiss } from '../ui/useAutoDismiss'
import { strings } from '../../shared/strings'

const HINT_MS = 2000

/** Sharing is not built yet: pressing it says so in a bubble that goes away on its own. */
export function ShareButton({ className }: { className: string }) {
  const [hintId, setHintId] = useState<number>()
  useAutoDismiss(hintId, HINT_MS, () => setHintId(undefined))

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setHintId(Date.now())}
        className="flex h-[30px] items-center gap-1.5 rounded-full bg-canvas/70 pr-3 pl-2.5 text-sm shadow-card backdrop-blur"
      >
        <Icon name="share" size={15} />
        {strings().bot.share.label}
      </button>
      <AnimatePresence>
        {hintId !== undefined && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: EASE_SWIFT }}
            className="absolute top-full right-0 mt-1.5 origin-top-right rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-canvas shadow-pop"
          >
            {strings().bot.share.soon}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
