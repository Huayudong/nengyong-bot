import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { strings } from '../../shared/strings'
import { AvatarCropper } from './AvatarCropper'
import type { AvatarCandidate, AvatarCrop } from './avatarImage'

interface Props {
  current: string | undefined // the uploaded picture in use, if any
  candidate: AvatarCandidate | null
  error: string | null
  onFile: (file: File) => void
  onCrop: (crop: AvatarCrop) => void
  onCancel: () => void
  onSave: () => void
  onRemove: () => void
}

/** The upload side of the avatar editor: take a picture by dropping, pasting or choosing one, then crop it to the circle. */
export function AvatarUpload({ current, candidate, error, onFile, onCrop, onCancel, onSave, onRemove }: Props) {
  const words = strings().bot.avatar
  const [isDragging, setIsDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const over = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }
  const leave = (event: DragEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
    setIsDragging(false)
  }
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {candidate ? (
        <>
          <AvatarCropper source={candidate.source} crop={candidate.crop} onChange={onCrop} />
          <span className="text-xs text-muted">
            {candidate.name} · {candidate.source.width}×{candidate.source.height}
          </span>
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 flex-1 rounded-full border border-line bg-side text-sm"
            >
              {words.cancel}
            </button>
            <button type="button" onClick={onSave} className="h-9 flex-1 rounded-full bg-ink text-sm text-canvas">
              {words.save}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: a drop is a pointer-only shortcut; the choose button opens the same picker from the keyboard */}
          <div
            data-active={isDragging || undefined}
            onDragOver={over}
            onDragLeave={leave}
            onDrop={drop}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line px-3 py-6 text-center data-active:border-soft data-active:bg-bubble"
          >
            <span className="text-sm text-soft">{words.drop}</span>
            <span className="text-xs text-muted">{words.or}</span>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="h-9 rounded-full bg-bubble px-4 text-sm"
            >
              {words.choose}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              aria-label={words.choose}
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (file) onFile(file)
              }}
            />
          </div>
          {current && (
            <button type="button" onClick={onRemove} className="text-sm text-danger">
              {words.remove}
            </button>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
