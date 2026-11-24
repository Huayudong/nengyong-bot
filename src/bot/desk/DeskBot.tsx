import type { Bot } from '../../../shared/bot'
import { bodyOf } from '../BotAvatar'
import type { DeskState } from '../deskState'

/** Where the bot sits in the 340×290 scene: its avatar's 100×100 box, scaled, the desk hiding it below the chest. */
export const BOT_BOX = { x: 168, y: 128, scale: 0.78 } as const

interface Props {
  bot: Bot
  state: DeskState['kind']
  reaction: { kind: string; at: number } | undefined // a poke: it hops, or reels when poked too often
}

/** The bot at its desk, drawn like its avatar; how it moves comes from data-state in src/index.css. */
export function DeskBot({ bot, state, reaction }: Props) {
  const { path, top, eyes, eye } = bodyOf(bot.shape)
  return (
    <g
      transform={`translate(${BOT_BOX.x} ${BOT_BOX.y}) scale(${BOT_BOX.scale})`}
      className="desk-bot"
      data-state={state}
      data-reaction={reaction?.kind}
    >
      <g key={reaction?.at} className={reaction && 'desk-hop'}>
        <g className="desk-body">
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
          <g className="desk-lids">
            {eyes.map(([x, y]) => (
              <ellipse key={x} cx={x} cy={y} rx={eye.rx} ry={eye.ry} fill="#fff" />
            ))}
            <g className="desk-pupils">
              {eyes.map(([x, y]) => (
                <circle key={x} cx={x + eye.pupilDx} cy={y + 1} r={eye.pupilR} fill="#111" />
              ))}
            </g>
          </g>
          {state === 'task' && <Headphones eyeY={eyes[0][1]} top={top} />}
          {(state === 'failed' || state === 'caught') && (
            <path className="desk-sweat" d="M88 26 q4 6 0 9 q-4 -3 0 -9z" fill="#7cc6ff" />
          )}
        </g>
      </g>
    </g>
  )
}

/** Ear cups at the eyes and a band arching just over the top of the head. */
function Headphones({ eyeY, top }: { eyeY: number; top: number }) {
  const cupY = eyeY - 4
  const peakY = top - 4
  const control = (peakY - 0.25 * cupY) / 0.75
  return (
    <g fill="#2a2a2e">
      <path
        d={`M9 ${cupY} C9 ${control} 91 ${control} 91 ${cupY}`}
        fill="none"
        stroke="#2a2a2e"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <rect x={2} y={cupY - 6} width={13} height={20} rx={5} />
      <rect x={85} y={cupY - 6} width={13} height={20} rx={5} />
    </g>
  )
}
