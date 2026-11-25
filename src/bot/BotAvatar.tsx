import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { type Bot, type Shape } from '../../shared/bot'
import { type OutfitSlot, wornOn } from '../../shared/outfit'
import { EASE_SWIFT } from '../ui/motion'
import { useBotActivity, type BotActivity } from './botActivity'
import { OutfitPiece } from './OutfitPiece'

type Eye = {
  rx: number
  ry: number
  pupilR: number
  pupilDx: number
  blush: string
  blushOpacity: number
  blushDy: number
}
/** legY: where the legs start; lower bodies with notched bottoms (star, heart) need them to start higher.
 * hat: where headwear sits (the middle of its base) and how big it is; chest: how high neckwear hangs. */
export type Body = {
  path: string
  top: number
  eyes: Array<[number, number]>
  eye: Eye
  legY?: number
  hat: [number, number, number]
  chest: number
}

const fixed = (value: number) => value.toFixed(1)
const polar = (r: number, deg: number, cy = 52): [number, number] => {
  const angle = ((deg - 90) * Math.PI) / 180
  return [50 + r * Math.cos(angle), cy + r * Math.sin(angle)]
}

/** Puffy n-point star: quadratic curves through segment midpoints round both tips and valleys. */
function starPath(points: number, outer: number, inner: number, tilt = 0): string {
  const pts = Array.from({ length: points * 2 }, (_, i) => polar(i % 2 ? inner : outer, tilt + (i * 180) / points))
  const mid = (i: number) => {
    const [ax, ay] = pts[i % pts.length]
    const [bx, by] = pts[(i + 1) % pts.length]
    return `${fixed((ax + bx) / 2)} ${fixed((ay + by) / 2)}`
  }
  return `M${mid(0)} ${pts.map((_, i) => `Q${pts[(i + 1) % pts.length].map(fixed).join(' ')} ${mid(i + 1)}`).join(' ')}Z`
}

/** Regular polygon with each corner cut by `round` of the edge and bridged by a quadratic curve. */
function roundedPolygon(sides: number, r: number, tilt: number, round = 0.26): string {
  const corners = Array.from({ length: sides }, (_, i) => polar(r, tilt + (i * 360) / sides))
  const lerp = (p: number[], q: number[], t: number) =>
    `${fixed(p[0] + (q[0] - p[0]) * t)} ${fixed(p[1] + (q[1] - p[1]) * t)}`
  const cuts = corners.map((p, i) => ({
    start: lerp(p, corners[(i - 1 + sides) % sides], round),
    corner: p.map(fixed).join(' '),
    end: lerp(p, corners[(i + 1) % sides], round),
  }))
  return `M${cuts[0].start} ${cuts.map((cut, i) => `Q${cut.corner} ${cut.end} L${cuts[(i + 1) % sides].start}`).join(' ')}Z`
}

const disc = ([cx, cy]: [number, number], r: number) =>
  `M${fixed(cx - r)} ${fixed(cy)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`

/** A centre disc plus `count` petal discs, as one path (overlapping subpaths fill as a union). */
function petalPath(core: number, count: number, dist: number, r: number, tilt: number): string {
  return (
    disc([50, 52], core) +
    Array.from({ length: count }, (_, i) => disc(polar(dist, tilt + (i * 360) / count), r)).join('')
  )
}

// The Nengyong Bot cast: body + round eyes with pupils + cheeks + two legs, no mouth.
const ROUND_EYE: Eye = { rx: 7.5, ry: 8.5, pupilR: 3.9, pupilDx: 0, blush: '#fff', blushOpacity: 0.32, blushDy: 12 }
const LOGO_EYE: Eye = { rx: 11, ry: 11, pupilR: 7, pupilDx: 6.8, blush: '#ff8fa8', blushOpacity: 0.7, blushDy: 16 }
const pair = (y: number, half = 9): Array<[number, number]> => [
  [50 - half, y],
  [50 + half, y],
]

// One body per shape id. Subpaths that overlap all run clockwise, so they fill as a union.
const SHAPES: Record<Shape, Body> = {
  blob: {
    path: 'M32 20 H68 Q86 20 86 38 V70 Q86 88 68 88 H32 Q14 88 14 70 V38 Q14 20 32 20Z',
    top: 20,
    eyes: [
      [36, 54],
      [64, 54],
    ],
    eye: LOGO_EYE,
    hat: [50, 28, 1],
    chest: 80,
  },
  cloud: {
    path:
      'M28 54 Q10 54 10 71 Q10 88 28 88 H72 Q90 88 90 71 Q90 54 72 54Z' +
      disc([30, 52], 16) +
      disc([52, 40], 22) +
      disc([72, 52], 16),
    top: 18,
    eyes: pair(64, 11),
    eye: ROUND_EYE,
    hat: [52, 25, 0.78],
    chest: 82,
  },
  onigiri: {
    path: 'M38 20 Q50 2 62 20 L88 66 Q100 88 76 88 H24 Q0 88 12 66Z',
    top: 11,
    eyes: pair(64, 10),
    eye: ROUND_EYE,
    hat: [50, 21, 0.55],
    chest: 82,
  },
  sun: { path: starPath(10, 40, 34, 18), top: 13, eyes: pair(52, 10), eye: ROUND_EYE, hat: [50, 21, 0.72], chest: 78 },
  clover: {
    path: petalPath(22, 4, 22, 22, 45),
    top: 14,
    eyes: pair(50, 9),
    eye: ROUND_EYE,
    hat: [50, 25, 0.78],
    chest: 76,
  },
  cat: {
    path: 'M16 46 L18 14 Q19 7 25 11 L40 26 H60 L75 11 Q81 7 82 14 L84 46 Q86 52 86 58 V70 Q86 88 68 88 H32 Q14 88 14 70 V58 Q14 52 16 46Z',
    top: 10,
    eyes: pair(56, 12),
    eye: ROUND_EYE,
    hat: [50, 31, 0.55],
    chest: 82,
  },
  pudding: {
    path: 'M30 22 H70 Q80 22 82 32 L90 76 Q92 88 80 88 H20 Q8 88 10 76 L18 32 Q20 22 30 22Z',
    top: 22,
    eyes: pair(56, 11),
    eye: ROUND_EYE,
    hat: [50, 29, 0.85],
    chest: 82,
  },
  diamond: {
    path: roundedPolygon(4, 42, 0, 0.28),
    top: 13,
    eyes: pair(50, 10),
    eye: ROUND_EYE,
    legY: 70,
    hat: [50, 20, 0.55],
    chest: 74,
  },
  mushroom: {
    path: 'M8 50 Q8 12 50 12 Q92 12 92 50 Q92 58 82 58 H18 Q8 58 8 50Z M30 54 H70 V78 Q70 88 60 88 H40 Q30 88 30 78Z',
    top: 12,
    eyes: pair(40, 12),
    eye: ROUND_EYE,
    hat: [50, 18, 0.85],
    chest: 68,
  },
  drop: {
    path: 'M50 12 C58 28 86 46 86 64 C86 80 70 88 50 88 C30 88 14 80 14 64 C14 46 42 28 50 12Z',
    top: 12,
    eyes: pair(62, 11),
    eye: ROUND_EYE,
    hat: [50, 21, 0.5],
    chest: 82,
  },
  octagon: {
    path: roundedPolygon(8, 40, 22.5, 0.2),
    top: 15,
    eyes: pair(52, 11),
    eye: ROUND_EYE,
    hat: [50, 22, 0.85],
    chest: 78,
  },
  bell: {
    path: 'M44 14 a6 6 0 1 1 12 0 a6 6 0 1 1 -12 0Z M50 18 Q74 18 76 44 L80 70 Q82 76 90 80 Q94 82 92 86 Q90 88 84 88 H16 Q10 88 8 86 Q6 82 10 80 Q18 76 20 70 L24 44 Q26 18 50 18Z',
    top: 8,
    eyes: pair(50, 10),
    eye: ROUND_EYE,
    hat: [50, 12, 0.5],
    chest: 76,
  },
}

/** A body in the avatar's 100×100 box: its outline (the staff badge tiles it as a print), the top of its head and its eyes, for drawing it elsewhere. */
export const bodyOf = (shape: Shape) => SHAPES[shape]

/** Deterministic per-bot timing so avatars never move in lockstep. */
function seedOf(id: string) {
  let hash = 2166136261
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619)
  return (hash >>> 0) / 2 ** 32
}

const MIN_ANIMATED_SIZE = 20
const HAPPY_SPIN = { duration: 1, ease: EASE_SWIFT } as const

/** Motion per activity: idle look-around, thinking sway, happy = 2 spins + bounce. */
function motionFor(activity: BotActivity | 'idle', seed: number) {
  const look = 5 + seed * 3
  const loop = { repeat: Infinity, ease: 'easeInOut' } as const
  if (activity === 'happy') {
    return {
      body: {
        animate: { rotate: [null, 720], y: [0, -14, 0, -5, 0] },
        transition: { ...HAPPY_SPIN, y: { duration: 0.8, delay: 0.2 } },
      },
      look: { animate: { x: 0, y: 0 }, transition: { duration: 0.2 } },
      lids: { animate: { scaleY: 0.55 }, transition: { duration: 0.15 } }, // happy squint
    }
  }
  if (activity === 'thinking') {
    return {
      body: { animate: { rotate: [-6, 6, -6], y: [0, -2, 0] }, transition: { ...loop, duration: 1.2 } },
      look: { animate: { x: [-3, 4, -3], y: -4 }, transition: { x: { ...loop, duration: 1.4 }, y: { duration: 0.3 } } },
      lids: {
        animate: { scaleY: [1, 1, 0.12, 1] },
        transition: { duration: 2.2, times: [0, 0.9, 0.95, 1], repeat: Infinity },
      },
    }
  }
  return {
    body: {
      animate: { rotate: [0, -4, 0, 3, 0], y: [0, -1.5, 0, -0.8, 0] },
      transition: { ...loop, duration: look, delay: -seed * look },
    },
    look: { animate: { x: [0, 3, 3, -2, 0], y: 0 }, transition: { ...loop, duration: look, delay: -seed * look } },
    lids: {
      animate: { scaleY: [1, 1, 0.12, 1] },
      transition: {
        duration: 3.5 + ((seed * 7) % 1) * 3,
        times: [0, 0.94, 0.97, 1],
        repeat: Infinity,
        delay: seed * 2,
      },
    },
  }
}

interface Props {
  bot: Bot
  size: number
  /** Idle/activity motion. Defaults on for avatars big enough to read it. */
  animated?: boolean
  badge?: ReactNode // positioned by the caller inside the avatar's box, so it moves with the avatar
}

export function BotAvatar({ bot, size, animated = size >= MIN_ANIMATED_SIZE, badge }: Props) {
  const body = SHAPES[bot.shape]
  const { path, eyes, eye, legY = 82 } = body
  const activity = useBotActivity(bot.id)
  const moves = animated ? motionFor(activity, seedOf(bot.id)) : null
  const eyeY = eyes[0][1]
  const worn = (slot: OutfitSlot) => {
    const id = wornOn(bot.outfit ?? [], slot)
    return id && <OutfitPiece id={id} body={body} />
  }

  if (bot.avatar) {
    return (
      <span
        data-activity={activity}
        data-avatar-of={bot.id}
        className="relative inline-flex shrink-0 motion-safe:group-hover:animate-[avatar-hop_.5s_var(--ease-sharp)]"
      >
        <img
          src={bot.avatar}
          alt=""
          width={size}
          height={size}
          draggable={false}
          className="rounded-full object-cover"
        />
        {badge}
      </span>
    )
  }

  return (
    // group-hover hop is driven by the parent row/tile having the `group` class
    <span
      data-activity={activity}
      data-avatar-of={bot.id}
      className="relative inline-flex shrink-0 motion-safe:group-hover:animate-[avatar-hop_.5s_var(--ease-sharp)]"
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" overflow="visible">
        {/* Motion defaults SVG to transform-box: fill-box, which would measure these px origins from each group's bounding box instead of the viewBox */}
        <motion.g
          style={{ originX: '50px', originY: '90px', transformBox: 'view-box' }}
          animate={moves?.body.animate}
          transition={moves?.body.transition}
        >
          {[33, 57].map((x) => (
            <rect key={x} x={x} y={legY} width={10} height={95 - legY} rx={5} fill="#2a2a2a" />
          ))}
          <path d={path} fill={bot.color} />
          {eyes.map(([x, y], side) => (
            <ellipse
              key={x}
              cx={x + (side ? 7 : -7)}
              cy={y + eye.blushDy}
              rx={4.2}
              ry={2.3}
              fill={eye.blush}
              opacity={eye.blushOpacity}
            />
          ))}
          {worn('neck')}
          <motion.g animate={moves?.look.animate} transition={moves?.look.transition}>
            <motion.g
              style={{ originX: '50px', originY: `${eyeY}px`, transformBox: 'view-box' }}
              animate={moves?.lids.animate}
              transition={moves?.lids.transition}
            >
              {eyes.map(([x, y]) => (
                <g key={x}>
                  <ellipse cx={x} cy={y} rx={eye.rx} ry={eye.ry} fill="#fff" />
                  <circle cx={x + eye.pupilDx} cy={y + 1} r={eye.pupilR} fill="#111" />
                </g>
              ))}
            </motion.g>
          </motion.g>
          {worn('face')}
          {worn('head')}
        </motion.g>
      </svg>
      {badge}
    </span>
  )
}
