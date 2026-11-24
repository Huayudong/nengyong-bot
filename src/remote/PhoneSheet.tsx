import type { ReactNode } from 'react'
import { Dialog } from '../ui/Dialog'

/** The bot's panel on a phone: a sheet over the lower part of the screen; a tap above it closes it. */
export function PhoneSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Dialog
      labelledBy="phone-sheet-title"
      onClose={onClose}
      className="mx-0 mt-auto mb-0 flex h-[88dvh] max-h-none w-full max-w-none flex-col overflow-hidden rounded-t-2xl bg-canvas"
    >
      <h2 id="phone-sheet-title" className="sr-only">
        {title}
      </h2>
      <span aria-hidden className="mx-auto mt-2 h-1.5 w-9 shrink-0 rounded-full bg-hover" />
      <div className="min-h-0 flex-1">{children}</div>
    </Dialog>
  )
}
