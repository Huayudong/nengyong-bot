import { motion } from 'motion/react'
import { SPRING } from './motion'

interface Props {
  id?: string // for a <label htmlFor> elsewhere; without one, give a `label`
  label?: string
  isOn: boolean
  onChange: (isOn: boolean) => void
}

export function Switch({ id, label, isOn, onChange }: Props) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      onClick={() => onChange(!isOn)}
      className="relative h-5 w-8 shrink-0 rounded-full bg-hover transition-colors duration-200 aria-checked:bg-accent"
    >
      <motion.span
        initial={false}
        animate={{ x: isOn ? 12 : 0 }}
        transition={SPRING}
        className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-card"
      />
    </button>
  )
}
