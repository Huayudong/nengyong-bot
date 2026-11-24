import { useId } from 'react'
import type { Shape } from '../../shared/bot'
import { bodyOf } from './BotAvatar'

/** A bot's outline printed over and over, tilted, in the current colour: the badge's band, a share card's backdrop. */
export function ShapePattern({ shape, className = '' }: { shape: Shape; className?: string }) {
  const patternId = useId()
  return (
    <svg aria-hidden="true" width="100%" height="100%" className={`absolute inset-0 ${className}`}>
      <defs>
        <pattern id={patternId} width={36} height={36} patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
          {[3, 21].map((offset) => (
            <path
              key={offset}
              d={bodyOf(shape).path}
              transform={`translate(${offset} ${offset}) scale(0.13)`}
              fill="currentColor"
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
