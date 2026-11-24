import { motion } from 'motion/react'
import { Icon, type IconName } from '../ui/Icon'
import { IconButton } from '../ui/IconButton'
import { ENTER } from '../ui/motion'
import { COPIED_LABEL, useCopy } from '../ui/useCopy'
import { strings } from '../../shared/strings'

interface Props {
  count: number
  isAll: boolean
  copyText: string // the picked messages as text, a paragraph each
  onSelectAll: () => void // all of them, or none once all are picked
  onShare: () => void
  onDelete: () => void
  onExit: () => void
}

/** Takes the message box's place in selection mode: how many messages are picked and what to do with them. */
export function SelectBar({ count, isAll, copyText, onSelectAll, onShare, onDelete, onExit }: Props) {
  const words = strings().chat.selection
  const [copied, copy] = useCopy()
  const isEmpty = count === 0
  return (
    <motion.div
      {...ENTER}
      role="toolbar"
      aria-label={words.label}
      className="mx-auto mb-4 flex w-[calc(100%-48px)] max-w-[952px] shrink-0 items-center gap-1 rounded-3xl border border-transparent bg-surface p-[5px] shadow-card"
    >
      <IconButton icon="close" label={words.exit} onClick={onExit} />
      <span role="status" className="px-1 text-md whitespace-nowrap">
        {words.selectedBefore}
        <motion.b
          key={count}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="inline-block font-semibold tabular-nums"
        >
          {count}
        </motion.b>
        {words.selectedAfter}
      </span>
      <button type="button" onClick={onSelectAll} className="h-[30px] rounded-full px-2.5 text-md text-soft">
        {isAll ? words.selectNone : words.selectAll}
      </button>
      <span className="flex-1" />
      <BarButton
        icon={copied === 'done' ? 'check' : 'copy'}
        label={copied ? COPIED_LABEL[copied] : words.copy}
        disabled={isEmpty}
        onClick={() => copy(copyText)}
      />
      <BarButton icon="share" label={words.share} disabled={isEmpty} onClick={onShare} />
      <BarButton icon="trash" label={words.delete} isDanger disabled={isEmpty} onClick={onDelete} />
    </motion.div>
  )
}

interface BarButtonProps {
  icon: IconName
  label: string
  isDanger?: boolean
  disabled: boolean
  onClick: () => void
}

function BarButton({ icon, label, isDanger, disabled, onClick }: BarButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-danger={isDanger || undefined}
      onClick={onClick}
      className="flex h-9 items-center gap-1.5 rounded-full bg-bubble pr-3.5 pl-3 text-md whitespace-nowrap disabled:opacity-40 data-danger:text-danger"
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  )
}
