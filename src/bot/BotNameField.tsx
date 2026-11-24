import { useState } from 'react'
import { BOT_NAME_MAX } from '../../shared/bot'
import { strings } from '../../shared/strings'

interface Props {
  name: string
  onRename: (name: string) => void
}

/** The name on the badge, editable in place and wrapping when long: Enter or leaving saves, Esc puts the name back, blank keeps it. */
export function BotNameField({ name, onRename }: Props) {
  const [draft, setDraft] = useState(name)
  const save = () => {
    const clean = draft.trim()
    if (clean !== '' && clean !== name) onRename(clean)
    else setDraft(name)
  }

  return (
    <textarea
      aria-label={strings().bot.nameLabel}
      value={draft}
      rows={1}
      maxLength={BOT_NAME_MAX}
      spellCheck={false}
      data-editable-text=""
      onChange={(e) => setDraft(e.target.value.replace(/\s*\n\s*/g, ' '))}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          e.preventDefault()
          e.currentTarget.blur()
        }
        if (e.key === 'Escape' && !e.nativeEvent.isComposing) setDraft(name)
      }}
      className="mx-auto mt-1 block field-sizing-content max-w-full min-w-12 resize-none rounded-md px-2.5 py-0.5 text-center text-xl font-medium outline-none transition-colors duration-150 focus:ring-1 focus:ring-accent"
    />
  )
}
