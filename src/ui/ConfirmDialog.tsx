import { Dialog } from './Dialog'
import { strings } from '../../shared/strings'

interface Props {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

/** Asks before a destructive action. Cancel gets focus so Enter is never destructive. */
export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onClose }: Props) {
  return (
    <Dialog labelledBy="confirm-title" onClose={onClose} className="w-[360px] rounded-xl bg-surface p-5">
      <h2 id="confirm-title" className="text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-md leading-relaxed text-soft">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button autoFocus onClick={onClose} className="h-9 rounded-full bg-bubble px-4 text-md">
          {strings().ui.cancel}
        </button>
        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className="h-9 rounded-full bg-danger px-4 text-md text-white"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
