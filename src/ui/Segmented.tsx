import { Icon, type IconName } from './Icon'

interface Props<Id extends string | number> {
  label: string // what the choice is about, for screen readers
  options: readonly { id: Id; label: string; icon?: IconName }[]
  value: Id
  onChange: (id: Id) => void
}

/** A few mutually exclusive choices side by side; the chosen one is raised. */
export function Segmented<Id extends string | number>({ label, options, value, onChange }: Props<Id>) {
  return (
    <div role="group" aria-label={label} className="inline-flex shrink-0 rounded-md bg-bubble p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className="inline-flex h-7 items-center gap-1 rounded-sm px-3 text-sm text-soft aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-card"
        >
          {option.icon && <Icon name={option.icon} size={14} />}
          {option.label}
        </button>
      ))}
    </div>
  )
}
