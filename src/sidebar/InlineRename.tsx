import { useState } from 'react'

interface Props {
  value: string
  label: string
  maxLength: number
  onDone: (name: string | null) => void // null = cancelled
  className: string // size and alignment, which differ between a tile, a row and a section header
}

/** Text field that replaces a label while renaming: Enter/blur saves, Esc cancels, blank keeps the old name. */
export function InlineRename({ value, label, maxLength, onDone, className }: Props) {
  const [draft, setDraft] = useState(value)
  const [done, setDone] = useState(false)
  const finish = (name: string | null) => {
    if (done) return // blur fires after Enter/Esc unmounts the field
    setDone(true)
    onDone(name)
  }
  return (
    <input
      autoFocus
      aria-label={label}
      value={draft}
      maxLength={maxLength}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => finish(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) finish(draft)
        if (e.key === 'Escape' && !e.nativeEvent.isComposing) finish(null)
        e.stopPropagation()
      }}
      onClick={(e) => e.stopPropagation()}
      className={`min-w-0 rounded-sm bg-surface px-1.5 outline-none ring-2 ring-accent ${className}`}
    />
  )
}
