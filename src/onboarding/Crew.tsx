import { AnimatePresence, motion } from 'motion/react'
import { BotActivityContext } from '../bot/botActivity'
import { BotAvatar } from '../bot/BotAvatar'
import { CREW_SIZE, DROP_PX, type Move, type Pose } from './crewPoses'

const MOVES: Record<Move, object> = {
  instant: { duration: 0 },
  hop: { type: 'spring', bounce: 0.45, visualDuration: 0.55 },
  glide: { type: 'spring', bounce: 0.18, visualDuration: 0.6 },
  fly: { type: 'spring', bounce: 0.12, visualDuration: 0.7 },
}
const WALK_OFF_PX = 120
const WALK_OFF = { duration: 0.45, ease: 'easeIn' } as const

/** The bots of the onboarding, drawn over the steps; each moves from its last pose to the next. */
export function Crew({ poses }: { poses: Pose[] }) {
  const moods = Object.fromEntries(poses.flatMap((pose) => (pose.mood ? [[pose.bot.id, pose.mood]] : [])))
  return (
    <BotActivityContext value={moods}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]">
        <AnimatePresence>
          {poses.map((pose) => (
            <Member key={pose.bot.id} pose={pose} />
          ))}
        </AnimatePresence>
      </div>
    </BotActivityContext>
  )
}

/** One bot: it drops onto the spot it turns up at, and walks off towards the nearer edge when it leaves. */
function Member({ pose }: { pose: Pose }) {
  const place = { x: pose.x, y: pose.y, scale: pose.scale, opacity: pose.opacity }
  const side = pose.x < 0 ? -1 : 1
  return (
    <motion.div
      className="absolute top-1/2 left-1/2"
      style={{ width: CREW_SIZE, height: CREW_SIZE, marginLeft: -CREW_SIZE / 2, marginTop: -CREW_SIZE / 2 }}
      initial={{ ...place, y: pose.y - DROP_PX, opacity: 0 }}
      animate={place}
      exit={{ x: pose.x + side * WALK_OFF_PX, opacity: 0, transition: WALK_OFF }}
      transition={{ ...MOVES[pose.move], delay: pose.delay ?? 0 }}
    >
      <BotAvatar bot={pose.bot} size={CREW_SIZE} />
    </motion.div>
  )
}
