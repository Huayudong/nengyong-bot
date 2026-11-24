import { IconButton } from '../ui/IconButton'
import { strings } from '../../shared/strings'

interface Props {
  forwardLabel: string
  onForward: () => void
  isForwardDisabled?: boolean
  onBack?: () => void
  tertiaryLabel?: string // a quieter way on, like skipping the step
  onTertiary?: () => void
}

/** The buttons along the bottom of an onboarding step: back, an optional way around, and on. */
export function StepFooter({ forwardLabel, onForward, isForwardDisabled, onBack, tertiaryLabel, onTertiary }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2.5">
      {onBack && <IconButton icon="arrowLeft" label={strings().onboarding.back} variant="raised" onClick={onBack} />}
      {tertiaryLabel && onTertiary && (
        <button type="button" onClick={onTertiary} className="h-10 rounded-full px-3.5 text-md text-soft">
          {tertiaryLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onForward}
        disabled={isForwardDisabled}
        className="h-10 min-w-[116px] rounded-full bg-ink px-[22px] text-md font-semibold text-canvas disabled:opacity-30"
      >
        {forwardLabel}
      </button>
    </div>
  )
}
