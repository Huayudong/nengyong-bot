import { motion } from 'motion/react'
import { strings } from '../../shared/strings'
import { EASE_SWIFT } from '../ui/motion'
import { MESSAGES_PER_POINT, POINTS_PER_FLOW_RUN, POINTS_PER_FLOW_SAVED, type Trust, tierOf } from '../../shared/trust'

/** How far the bot is to its next level, and what the two of you have done together. */
export function TrustProgress({ trust, className }: { trust: Trust; className?: string }) {
  const tier = tierOf(trust.level)
  const progress = trust.needed ? trust.points / trust.needed : 1

  return (
    <div className={className}>
      <div className="h-2 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: tier.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE_SWIFT }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-white/60 tabular-nums">
        {trust.needed ? (
          <>
            <span>{strings().island.trust.xp(trust.points, trust.needed)}</span>
            <span>{strings().island.trust.toNextLevel(trust.level + 1, trust.needed - trust.points)}</span>
          </>
        ) : (
          <span>{strings().island.maxedOut}</span>
        )}
      </div>
      <dl className="mt-3.5 grid grid-cols-3 gap-2">
        <Stat
          value={trust.messages}
          label={strings().island.trust.chats}
          reward={strings().island.trust.chatReward(MESSAGES_PER_POINT)}
        />
        <Stat value={trust.flowsSaved} label={strings().island.trust.flowsSaved} reward={`+${POINTS_PER_FLOW_SAVED}`} />
        <Stat value={trust.flowRuns} label={strings().island.trust.flowRuns} reward={`+${POINTS_PER_FLOW_RUN}`} />
      </dl>
    </div>
  )
}

function Stat({ value, label, reward }: { value: number; label: string; reward: string }) {
  return (
    <div className="relative flex flex-col-reverse rounded-lg bg-white/10 px-3 py-2">
      <dt className="text-xs text-white/60">{label}</dt>
      <dd className="text-xl leading-[1.3] font-semibold tabular-nums">{value}</dd>
      <span aria-hidden="true" className="absolute top-2 right-2.5 text-xs font-bold text-white/40 tabular-nums">
        {reward}
      </span>
    </div>
  )
}
