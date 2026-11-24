import { motion } from 'motion/react'
import { Icon } from '../ui/Icon'
import { ENTER } from '../ui/motion'
import { strings } from '../../shared/strings'

/** Over the list or the chat while the computer cannot be reached; once it can, the page starts over by itself. */
export function ConnectionBanner() {
  return (
    <motion.p
      {...ENTER}
      role="status"
      className="mx-3 mt-2 flex shrink-0 items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-sm leading-snug shadow-card"
    >
      <span className="text-muted">
        <Icon name="wifiOff" />
      </span>
      <span className="min-w-0 flex-1">
        {strings().remote.unreachable}
        <small className="block text-xs text-muted">{strings().remote.bannerHint}</small>
      </span>
    </motion.p>
  )
}
