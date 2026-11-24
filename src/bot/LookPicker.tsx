import type { ReactNode } from 'react'
import { type Bot, PALETTE, PICKER_SHAPES } from '../../shared/bot'
import { BotAvatar } from './BotAvatar'
import { strings } from '../../shared/strings'

export type Look = Pick<Bot, 'shape' | 'color'>

interface Props {
  look: Look
  compact?: boolean // the avatar editor's popover: smaller cells, so it fits the narrowest panel
  onPick: (look: Look) => void
}

export function LookPicker({ look, compact = false, onPick }: Props) {
  return (
    <div
      data-compact={compact || undefined}
      className="group/look flex w-full flex-col items-center gap-5 data-compact:gap-3"
    >
      <div
        role="radiogroup"
        aria-label={strings().bot.look.shape}
        className="grid grid-cols-5 gap-x-3 gap-y-2 group-data-compact/look:w-full group-data-compact/look:gap-x-0 group-data-compact/look:gap-y-1 group-data-compact/look:justify-items-center"
      >
        {PICKER_SHAPES.map((shape) => (
          <ChoiceButton
            key={shape}
            label={strings().common.shapes[shape]}
            checked={look.shape === shape}
            onPick={() => onPick({ ...look, shape })}
          >
            <BotAvatar
              bot={{ id: `pick-${shape}`, name: strings().common.shapes[shape], shape, color: look.color }}
              size={compact ? 36 : 44}
              animated={false}
            />
          </ChoiceButton>
        ))}
      </div>

      <div
        role="radiogroup"
        aria-label={strings().bot.look.color}
        className="flex max-w-[400px] flex-wrap justify-center gap-x-4 gap-y-3 group-data-compact/look:max-w-[236px] group-data-compact/look:gap-1"
      >
        {PALETTE.map((color) => (
          <ChoiceButton
            key={color.id}
            label={strings().common.colors[color.id]}
            round
            checked={look.color === color.value}
            onPick={() => onPick({ ...look, color: color.value })}
          >
            <span
              className="block size-10 rounded-full group-data-compact/look:size-6"
              style={{ background: color.value }}
            />
          </ChoiceButton>
        ))}
      </div>
    </div>
  )
}

interface ChoiceProps {
  label: string
  checked: boolean
  round?: boolean
  onPick: () => void
  children: ReactNode
}

function ChoiceButton({ label, checked, round = false, onPick, children }: ChoiceProps) {
  return (
    <button
      role="radio"
      aria-checked={checked}
      aria-label={label}
      title={label}
      data-round={round || undefined}
      onClick={onPick}
      className="group grid place-items-center rounded-xl p-1.5 ring-line transition-shadow duration-150 aria-checked:ring-2 aria-checked:ring-ink/20 data-round:rounded-full"
    >
      {children}
    </button>
  )
}
