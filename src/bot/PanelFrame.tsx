import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useState } from 'react'
import { PANEL_TRANSITION } from '../ui/motion'
import { type LivePanel, PanelResizer } from './PanelResizer'

interface Props {
  isOpen: boolean
  width: number
  maxWidth: number
  onCommit: (width: number) => void
  onClose: () => void
  children: ReactNode
}

/** The frame around the right panel: its open/close morph and its width, which follows the resize handle live. */
export function PanelFrame({ isOpen, width: storedWidth, maxWidth, onCommit, onClose, children }: Props) {
  const width = Math.min(storedWidth, maxWidth)
  const [live, setLive] = useState<LivePanel | null>(null)
  const isClosing = live?.isClosing ?? false
  // like the sidebar: the close/reopen morph stays animated mid-drag; plain width changes follow the pointer instantly
  const [isMorphing, setIsMorphing] = useState(false)
  const [wasClosing, setWasClosing] = useState(false)
  if (wasClosing !== isClosing) {
    setWasClosing(isClosing)
    setIsMorphing(true)
  }
  const shownWidth = live?.width ?? width

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="panel"
          className="relative shrink-0 overflow-hidden"
          initial={{ width: 0, opacity: 0 }}
          animate={isClosing ? { width: 0, opacity: 0 } : { width: shownWidth, opacity: 1 }}
          // own transition: the exiting element keeps its last props, which mid-drag would be duration 0
          exit={{ width: 0, opacity: 0, transition: PANEL_TRANSITION }}
          transition={live && !isMorphing ? { duration: 0 } : PANEL_TRANSITION}
          onAnimationComplete={() => setIsMorphing(false)}
        >
          {/* the content keeps its full width while the frame narrows around it */}
          <div style={{ width: shownWidth }} className="h-full">
            {children}
          </div>
          <PanelResizer width={width} maxWidth={maxWidth} onLive={setLive} onCommit={onCommit} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
