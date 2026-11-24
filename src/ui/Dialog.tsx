import { motion, PresenceContext } from 'motion/react'
import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { EASE_SHARP } from './motion'
import { strings } from '../../shared/strings'

interface Props {
  labelledBy: string // id of the element holding the title
  onClose: () => void
  className: string // size, background and corners; the rest is the same for every dialog
  children: ReactNode
}

const ZOOM = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.2, ease: EASE_SHARP },
}

const EnclosingPresenceId = createContext<string | null>(null)

/**
 * Native <dialog>: modal focus trap and a backdrop for free. Esc or a click on the backdrop closes it.
 * It zooms in and out while the backdrop fades, so its owner renders it straight inside an AnimatePresence.
 */
export function Dialog({ labelledBy, onClose, className, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const presence = useContext(PresenceContext)
  const enclosingPresenceId = useContext(EnclosingPresenceId)

  const isNested = enclosingPresenceId !== null
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (typeof dialog.showModal !== 'function') {
      dialog.setAttribute('open', '') // jsdom has no showModal
      return
    }
    if (!isNested) return dialog.showModal()
    // children's effects run before their parent's: opened together with the dialog it sits in, it would end up under it
    queueMicrotask(() => {
      if (dialog.isConnected && !dialog.open) dialog.showModal()
    })
  }, [isNested])

  // AGENTS.md「动画」: without its own AnimatePresence the owner unmounts the dialog before it can animate out
  if (!presence || presence.id === enclosingPresenceId) throw new Error(strings().ui.dialogOutsidePresence)
  const isClosing = !presence.isPresent

  return createPortal(
    <EnclosingPresenceId value={presence.id}>
      <motion.dialog
        {...ZOOM}
        ref={ref}
        aria-labelledby={labelledBy}
        data-closing={isClosing || undefined}
        inert={isClosing}
        onClose={onClose}
        onCancel={(event) => {
          // Esc would hide the dialog at once; the owner unmounts it instead, after the exit animation
          event.preventDefault()
          // React bubbles events through portals, so Esc in a dialog opened from another dialog would close both
          event.stopPropagation()
          onClose()
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()} // only the backdrop is the dialog element itself
        className={`m-auto text-ink shadow-modal backdrop:bg-black/25 backdrop:transition-opacity backdrop:duration-200 backdrop:ease-sharp starting:backdrop:opacity-0 data-closing:backdrop:opacity-0 ${className}`}
      >
        {children}
      </motion.dialog>
    </EnclosingPresenceId>,
    document.body,
  )
}
