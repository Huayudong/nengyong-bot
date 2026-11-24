import type { ComponentProps, ReactNode } from 'react'
import { Icon } from '../ui/Icon'

/** A card of rows, titled unless the page's tab already names it; the building block of every settings page. */
export function SettingsSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      {title && <h3 className="mb-2 px-1 text-sm text-muted">{title}</h3>}
      <div className="divide-y divide-line rounded-xl border border-line bg-surface">{children}</div>
    </section>
  )
}

interface RowProps {
  id?: string
  label: string
  hint?: ReactNode
  children: ReactNode
}

export function SettingsRow({ id, label, hint, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-8 px-5 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-md text-ink">
          {label}
        </label>
        {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

/** The secondary button at the right end of a row. */
export function SettingsButton(props: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className="h-8 shrink-0 rounded-md border border-line bg-surface px-3 text-sm disabled:opacity-40"
    />
  )
}

/** The one button of a row or card that goes ahead. */
export function SettingsPrimaryButton(props: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className="h-8 shrink-0 rounded-md bg-ink px-3.5 text-sm text-canvas disabled:opacity-40"
    />
  )
}

interface SelectProps<Id extends string> {
  id: string // the row's label points here
  value: Id
  options: readonly { id: Id; label: string }[]
  onChange: (value: Id) => void
}

/** A native select dressed as the row's pill; the menu that opens is the system's own. */
export function SettingsSelect<Id extends string>({ id, value, options, onChange }: SelectProps<Id>) {
  return (
    <span className="relative shrink-0">
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const picked = options.find((option) => option.id === event.target.value)
          if (picked) onChange(picked.id)
        }}
        className="h-8 appearance-none rounded-md border border-line bg-surface pr-8 pl-3 text-sm text-ink outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted">
        <Icon name="down" size={14} />
      </span>
    </span>
  )
}
