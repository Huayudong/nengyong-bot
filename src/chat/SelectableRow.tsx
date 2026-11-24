import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Icon } from '../ui/Icon'
import type { ENTER } from '../ui/motion'
import { useLongPress } from '../ui/useLongPress'
import type { SelectionEvent } from './selection'
import { strings } from '../../shared/strings'

interface Props {
  seq?: number // none for the greeting, the reply being streamed and queued messages: they cannot be picked
  side: 'start' | 'end'
  isSelecting: boolean
  isSelected: boolean
  isFlush?: boolean // sits right under a time divider
  enter: typeof ENTER | { initial: false }
  className?: string // where it sits, never how it looks
  onSelection: (event: SelectionEvent) => void
  children: ReactNode
}

/**
 * A message across the width of the chat. Holding it starts selection mode; in it the whole row is the target: a
 * press picks or drops it, and the rows a pressed pointer is dragged over follow suit.
 */
export function SelectableRow({
  seq,
  side,
  isSelecting,
  isSelected,
  isFlush,
  enter,
  className = '',
  onSelection,
  children,
}: Props) {
  const longPress = useLongPress(() => {
    if (seq !== undefined) onSelection({ kind: 'start', seq })
  })

  return (
    <motion.div
      {...enter}
      data-side={side}
      data-flush={isFlush || undefined}
      data-selecting={isSelecting || undefined}
      data-selected={isSelected || undefined}
      onPointerDown={(event) => {
        if (!isSelecting || seq === undefined || event.button !== 0) return
        event.preventDefault() // a drag that picks rows selects no text
        onSelection({ kind: 'press', seq, isRange: event.shiftKey })
      }}
      onPointerEnter={(event) => {
        if (isSelecting && seq !== undefined && event.buttons === 1) onSelection({ kind: 'drag', seq })
      }}
      className={`group/row -mx-2.5 flex items-start rounded-2xl px-2.5 transition-colors duration-150 data-selected:bg-ink/5 data-selecting:select-none ${className}`}
    >
      <span
        inert={!isSelecting}
        className="grid h-11 w-0 shrink-0 place-items-center overflow-hidden opacity-0 transition-[width,margin,opacity] duration-300 ease-sharp group-data-selecting/row:mr-3 group-data-selecting/row:w-6 group-data-selecting/row:opacity-100"
      >
        {seq !== undefined && (
          <button
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            aria-label={strings().chat.selection.selectMessage}
            // a click from Space or Enter has detail 0; a pointer has already picked the row on pointerdown
            onClick={(event) => event.detail === 0 && onSelection({ kind: 'press', seq, isRange: event.shiftKey })}
            className="grid size-5 place-items-center rounded-full text-transparent ring-[1.5px] ring-ink/25 ring-inset aria-checked:bg-ink aria-checked:text-canvas aria-checked:ring-0"
          >
            <Icon name="check" size={13} />
          </button>
        )}
      </span>
      <div inert={isSelecting} className="flex min-w-0 flex-1 group-data-[side=end]/row:justify-end">
        <div
          {...longPress.handlers}
          data-pressing={longPress.isPressing || undefined}
          className="max-w-[min(600px,62%)] transition-transform duration-300 data-pressing:scale-96 data-pressing:duration-500"
        >
          {children}
        </div>
      </div>
    </motion.div>
  )
}
