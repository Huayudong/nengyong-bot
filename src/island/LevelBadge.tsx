import { motion } from 'motion/react'
import { levelEffectOf, tierOf } from '../../shared/trust'

/** "Lv.12" on its tier's colour; it pops when the number changes. */
export function LevelBadge({ level }: { level: number }) {
  return (
    <motion.span
      key={level}
      data-effect={levelEffectOf(level)}
      style={{ backgroundColor: tierOf(level).color }}
      className="level-effect relative inline-flex h-5 shrink-0 items-center overflow-hidden rounded-full bg-gradient-to-b from-white/25 to-white/0 px-1.5 text-xs font-bold text-white tabular-nums"
      initial={{ scale: 1.4 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', bounce: 0.55, visualDuration: 0.35 }}
    >
      <span className="mr-px font-semibold opacity-75">Lv.</span>
      {level}
    </motion.span>
  )
}
