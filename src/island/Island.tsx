import { AnimatePresence, motion, spring } from 'motion/react'
import { type ReactNode, useRef } from 'react'
import { type ElementSize, useElementSize } from '../ui/useElementSize'

const GROW = String(spring(0.5, 0.3))
const SHRINK_WITHOUT_OVERSHOOT = String(spring(0.38, 0))
const CONTENT_HIDDEN = { opacity: 0, scale: 0.9, filter: 'blur(6px)' }
const CONTENT_SHOWN = { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.28, delay: 0.08 } }
const CONTENT_LEAVING = { ...CONTENT_HIDDEN, transition: { duration: 0.14 } }

interface Props {
  view: string // a new view cross-fades in while the island springs to its size
  children: ReactNode
}

/** The black capsule at the top of the chat: it measures what it holds and morphs to that size. */
export function Island({ view, children }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const size = useElementSize(contentRef)

  return (
    <div
      aria-live="polite"
      className="no-drag pointer-events-auto relative overflow-hidden rounded-3xl bg-black text-white shadow-pop"
      style={size ? { width: size.width, height: size.height, transition: transitionTo(size) } : undefined}
    >
      <div ref={contentRef} className="absolute top-0 left-1/2 w-max -translate-x-1/2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={view} initial={CONTENT_HIDDEN} animate={CONTENT_SHOWN} exit={CONTENT_LEAVING}>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// a CSS transition, not a motion animation: a hidden window runs no animation frames, and the size must land anyway
function transitionTo({ width, height, previous }: ElementSize) {
  if (!previous) return undefined
  const ease = (next: number, before: number) => (next >= before ? GROW : SHRINK_WITHOUT_OVERSHOOT)
  return `width ${ease(width, previous.width)}, height ${ease(height, previous.height)}`
}
