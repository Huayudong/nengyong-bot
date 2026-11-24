import { useId } from 'react'
import { Dialog } from '../ui/Dialog'

/**
 * An image at full size over the app, zooming in and out while the backdrop fades; Esc or a click beside it closes.
 * The dialog fills the window, so a click beside the image lands on it and its own shadow stays off screen.
 */
export function ImagePreview({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  const id = useId()
  return (
    <Dialog
      labelledBy={id}
      onClose={onClose}
      className="grid size-full max-h-none max-w-none place-items-center bg-transparent"
    >
      <img id={id} src={src} alt={name} className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-modal" />
    </Dialog>
  )
}
