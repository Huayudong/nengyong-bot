import { strings } from '../../shared/strings'

interface Props {
  isDebug: boolean
  onChange: (isDebug: boolean) => void
}

/** The opened island's switch for debug mode, the same one as in settings. */
export function DebugToggle({ isDebug, onChange }: Props) {
  return (
    <button
      type="button"
      aria-pressed={isDebug}
      onClick={() => onChange(!isDebug)}
      className="shrink-0 rounded-sm bg-white/12 px-2 text-xs leading-[22px] font-semibold text-white/60 aria-pressed:bg-warning/15 aria-pressed:text-warning"
    >
      {strings().debug.mode}
    </button>
  )
}
