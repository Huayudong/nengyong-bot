import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE_SWIFT } from '../ui/motion'
import { type Trust, tierOf } from '../../shared/trust'

const STROKE = 2.5

interface Props {
  trust: Pick<Trust, 'level' | 'points' | 'needed'>
  size: number
  children: ReactNode // the avatar, on a white disc so a black bot shows on the black island
}

/** A ring around the avatar that fills up as the bot earns its next level, in the colour of its tier. */
export function TrustRing({ trust, size, children }: Props) {
  const radius = (size - STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const progress = trust.needed ? trust.points / trust.needed : 1
  const disc = size - 2 * STROKE - 2

  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true" className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={STROKE} className="stroke-current/15" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          stroke={tierOf(trust.level).color}
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 0.9, ease: EASE_SWIFT }}
        />
      </svg>
      <span className="grid place-items-center rounded-full bg-white" style={{ width: disc, height: disc }}>
        {children}
      </span>
    </span>
  )
}
