import { strings } from '../../shared/strings'
import { Icon } from '../ui/Icon'

/** Said before the user starts an update while bots are at work: the restart stops them. Nothing when none is. */
export function BusyWarning({ names }: { names: string[] }) {
  const [first] = names
  if (first === undefined) return null
  return (
    <p className="mt-3 flex gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm">
      <span className="mt-px text-warning">
        <Icon name="warning" size={16} />
      </span>
      {strings().settings.update.busy(first, names.length)}
    </p>
  )
}
