import { type ReactNode, useId } from 'react'
import type { OutfitId } from '../../shared/outfit'
import type { Body } from './BotAvatar'

/** One piece of a bot's outfit, drawn in the avatar's 100×100 box where this body wears it. */
export function OutfitPiece({ id, body }: { id: OutfitId; body: Body }) {
  switch (id) {
    case 'partyHat':
    case 'bronzeCrown':
    case 'silverCrown':
    case 'goldCrown':
    case 'halo':
    case 'rainbowCrown':
      return (
        <OnHead body={body}>
          <Headwear id={id} />
        </OnHead>
      )
    case 'roundGlasses':
      return <RoundGlasses body={body} />
    case 'sunglasses':
      return <Sunglasses body={body} />
    case 'monocle':
      return <Monocle body={body} />
    case 'bowTie':
      return <BowTie chest={body.chest} />
    case 'tie':
      return <Tie chest={body.chest} />
    case 'medal':
      return <Medal chest={body.chest} />
    default:
      return id satisfies never
  }
}

/** Headwear is drawn with the middle of its base at 0,0 and set where this body's head is, tilted a little. */
function OnHead({ body, children }: { body: Body; children: ReactNode }) {
  const [x, y, scale] = body.hat
  return <g transform={`translate(${x} ${y}) rotate(-8) scale(${scale})`}>{children}</g>
}

const CROWN = 'M27 26 L24 4 L37 16 L37 8 L50 -2 L63 8 L63 16 L76 4 L73 26 Z'
const CROWN_TIPS: Array<[number, number]> = [
  [24, 4],
  [37, 8],
  [50, -2],
  [63, 8],
  [76, 4],
]

function Headwear({ id }: { id: 'partyHat' | 'bronzeCrown' | 'silverCrown' | 'goldCrown' | 'halo' | 'rainbowCrown' }) {
  switch (id) {
    case 'partyHat':
      return (
        <>
          <path d="M-13 0 L0 -31 L13 0 Z" fill="#4A8CFF" stroke="#4A8CFF" strokeWidth={3} strokeLinejoin="round" />
          <path d="M-9.4 -8 H9.4 M-5.7 -17 H5.7" stroke="#F2B705" strokeWidth={3.4} />
          <ellipse cx={0} cy={0} rx={14.5} ry={3.2} fill="#2F6FED" />
          <circle cx={0} cy={-32} r={4.6} fill="#FF5A5F" />
        </>
      )
    case 'bronzeCrown':
      return (
        <g transform="translate(-50 -28)">
          <path
            d="M28 26 L25 8 L38 17 L50 3 L62 17 L75 8 L72 26 Z"
            fill="#C8874A"
            stroke="#C8874A"
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <rect x={26} y={20} width={48} height={8} rx={3} fill="#A5672F" />
          <circle cx={25} cy={8} r={3.5} fill="#A5672F" />
          <circle cx={75} cy={8} r={3.5} fill="#A5672F" />
          <circle cx={50} cy={3} r={4.4} fill="#2BC48A" />
        </g>
      )
    case 'silverCrown':
      return (
        <g transform="translate(-50 -28)">
          <path d={CROWN} fill="#9EA8B3" stroke="#9EA8B3" strokeWidth={7} strokeLinejoin="round" />
          <path d={CROWN} fill="#DFE4EA" stroke="#DFE4EA" strokeWidth={3.5} strokeLinejoin="round" />
          <rect x={25} y={20} width={50} height={8} rx={3} fill="#B4BDC7" />
          {CROWN_TIPS.map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={3.6} fill="#F4F6F8" stroke="#9EA8B3" strokeWidth={1.2} />
          ))}
          <circle cx={50} cy={24} r={2.6} fill="#4A8CFF" />
        </g>
      )
    case 'goldCrown':
      return (
        <g transform="translate(-50 -28)">
          <path d={CROWN} fill="#F5C542" stroke="#F5C542" strokeWidth={4} strokeLinejoin="round" />
          <rect x={25} y={20} width={50} height={8} rx={3} fill="#E0A92A" />
          {CROWN_TIPS.map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={4} fill="#FF6B6B" />
          ))}
        </g>
      )
    case 'halo':
      return (
        <>
          <ellipse cx={0} cy={-16} rx={21} ry={6} fill="none" stroke="#F5C542" strokeWidth={4.5} />
          <ellipse cx={0} cy={-16} rx={21} ry={6} fill="none" stroke="#FFF6C8" strokeWidth={1.6} />
        </>
      )
    case 'rainbowCrown':
      return <RainbowCrown />
    default:
      return id satisfies never
  }
}

const RAINBOW = ['#FF5A5F', '#F2B705', '#2BC48A', '#4A8CFF', '#7B5CF5']

function RainbowCrown() {
  const gradientId = useId()
  return (
    <g transform="translate(-50 -28)" className="motion-safe:animate-[badge-rainbow_3s_linear_infinite]">
      <defs>
        <linearGradient id={gradientId} x1={0} x2={1}>
          {RAINBOW.map((color, index) => (
            <stop key={color} offset={index / (RAINBOW.length - 1)} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      <path
        d={CROWN}
        fill={`url(#${gradientId})`}
        stroke={`url(#${gradientId})`}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <rect x={25} y={20} width={50} height={8} rx={3} fill="#FFFFFF" opacity={0.45} />
      {CROWN_TIPS.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={4} fill="#FFFFFF" />
      ))}
      <path
        d="M84 2 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6Z M14 12 l1 2.6 2.6 1 -2.6 1 -1 2.6 -1 -2.6 -2.6 -1 2.6 -1Z"
        fill="#F2B705"
      />
    </g>
  )
}

/** A rim that clears the eye even when the eye looks around inside it. */
const rimOf = ({ eye }: Body) => Math.max(eye.rx, eye.ry) + 3

function RoundGlasses({ body }: { body: Body }) {
  const [left, right] = body.eyes
  const rim = rimOf(body)
  return (
    <g stroke="#1A1A1A" strokeLinecap="round">
      {body.eyes.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={rim} fill="#FFFFFF" fillOpacity={0.12} strokeWidth={2.6} />
      ))}
      {right[0] - left[0] > 2 * rim && (
        <path
          d={`M${left[0] + rim} ${left[1] - 1} Q50 ${left[1] - 5} ${right[0] - rim} ${right[1] - 1}`}
          fill="none"
          strokeWidth={2.4}
        />
      )}
      <path d={`M${left[0] - rim} ${left[1] - 1} l-5 -2 M${right[0] + rim} ${right[1] - 1} l5 -2`} strokeWidth={2.4} />
    </g>
  )
}

function Sunglasses({ body }: { body: Body }) {
  const [left, right] = body.eyes
  const width = body.eye.rx + 5
  const height = body.eye.ry + 4
  const top = left[1] - height * 0.5
  return (
    <g stroke="#141414" strokeLinecap="round">
      {body.eyes.map(([x, y]) => (
        <g key={x}>
          <path
            d={`M${x - width} ${y - height * 0.55} H${x + width} V${y} Q${x + width} ${y + height} ${x} ${y + height} Q${x - width} ${y + height} ${x - width} ${y}Z`}
            fill="#141414"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path
            d={`M${x - width * 0.5} ${y - height * 0.2} h${width * 0.45}`}
            stroke="#FFFFFF"
            strokeOpacity={0.5}
            strokeWidth={2}
          />
        </g>
      ))}
      <path d={`M${left[0] + width} ${top} H${right[0] - width}`} strokeWidth={3} />
      <path d={`M${left[0] - width} ${top} l-4 -1 M${right[0] + width} ${top} l4 -1`} strokeWidth={2.4} />
    </g>
  )
}

function Monocle({ body }: { body: Body }) {
  const [x, y] = body.eyes[1]
  const rim = rimOf(body)
  return (
    <g stroke="#E0A92A" fill="none">
      <circle cx={x} cy={y} r={rim} fill="#FFFFFF" fillOpacity={0.18} strokeWidth={2.8} />
      <path
        d={`M${x + rim * 0.7} ${y + rim * 0.7} Q${x + rim + 7} ${y + rim + 8} ${x + rim + 1} ${y + rim + 17}`}
        strokeWidth={1.4}
        strokeDasharray="1.6 1.8"
        strokeLinecap="round"
      />
    </g>
  )
}

/** Neckwear gets a white keyline so it stands out on a body of any colour. */
const KEYLINE = { stroke: '#FFFFFF', strokeWidth: 1.6, strokeLinejoin: 'round', paintOrder: 'stroke' } as const

function BowTie({ chest }: { chest: number }) {
  return (
    <g transform={`translate(50 ${chest})`}>
      <path d="M-2 -2 L-12 -7 Q-14.5 0 -12 7 L-2 2 Z M2 -2 L12 -7 Q14.5 0 12 7 L2 2 Z" fill="#E5242A" {...KEYLINE} />
      <rect x={-3.5} y={-4} width={7} height={8} rx={2.5} fill="#B81C21" {...KEYLINE} />
    </g>
  )
}

function Tie({ chest }: { chest: number }) {
  return (
    <g transform={`translate(50 ${chest - 12})`}>
      <path d="M-4 5.5 H4 L6.5 13.5 L0 18.5 L-6.5 13.5 Z" fill="#1E1E22" {...KEYLINE} strokeWidth={2.4} />
      <path d="M-5.5 -0.5 H5.5 L4 5.5 H-4 Z" fill="#1E1E22" {...KEYLINE} strokeWidth={2.4} />
      <path d="M-4.2 10.5 L4.6 8 M-5.6 15 L5.4 12" stroke="#E5242A" strokeWidth={1.6} />
    </g>
  )
}

function Medal({ chest }: { chest: number }) {
  return (
    <g transform={`translate(50 ${chest - 3})`}>
      <path d="M-9 -12 L-4 -12 L1 -1 L-3 -1 Z" fill="#E5242A" {...KEYLINE} />
      <path d="M9 -12 L4 -12 L-1 -1 L3 -1 Z" fill="#2F6FED" {...KEYLINE} />
      <circle cx={0} cy={1.5} r={6} fill="#F5C542" {...KEYLINE} />
      <circle cx={0} cy={1.5} r={3.6} fill="none" stroke="#E0A92A" strokeWidth={1.2} />
    </g>
  )
}
