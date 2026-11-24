import { motion } from 'motion/react'
import type { Bot } from '../../shared/bot'
import { TEAM_SPOTS } from './crewPoses'
import { DEMO_TEAM } from './identities'
import { StepFooter } from './StepFooter'
import { StepHeading } from './StepHeading'
import { strings } from '../../shared/strings'

const words = strings().onboarding.team

const NEW_JOB = words.task

interface Props {
  beat: number
  boss: Bot
  onBack: () => void
  onNext: () => void
}

/** Three bots drop in under the boss, each with its job; the analyst takes on a new one. */
export function TeamStep({ beat, boss, onBack, onNext }: Props) {
  return (
    <>
      {DEMO_TEAM.map((bot, index) => {
        const spot = TEAM_SPOTS[bot.id] ?? { x: 0, y: 0 }
        const isNew = bot.id === 'demo-analyst' && beat >= 2
        return (
          <motion.div
            key={bot.id}
            data-new={isNew || undefined}
            className="absolute flex -translate-x-1/2 flex-col items-center rounded-lg bg-surface px-3 py-1.5 text-xs leading-[1.45] whitespace-nowrap shadow-card transition-shadow duration-300 data-new:ring-[1.5px] data-new:ring-accent"
            style={{ left: `calc(50% + ${spot.x}px)`, top: 280 + spot.y + 50 }}
            initial={{ opacity: 0, y: 6 }}
            animate={beat >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.3, delay: beat === 1 ? 0.3 + index * 0.09 : 0 }}
          >
            <b className="text-sm font-semibold">{bot.name}</b>
            <span data-new={isNew || undefined} className="text-muted data-new:text-accent">
              {isNew ? NEW_JOB : bot.duty}
            </span>
            {isNew && (
              <motion.span
                className="absolute -top-2.5 -right-2 h-[18px] rounded-full bg-accent px-1.5 text-xs leading-[18px] font-bold text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, visualDuration: 0.3 }}
              >
                {words.newJob}
              </motion.span>
            )}
          </motion.div>
        )
      })}
      <StepHeading top={404} title={words.title} sub={words.lede(boss.name)} />
      <StepFooter forwardLabel={strings().onboarding.next} onForward={onNext} onBack={onBack} />
    </>
  )
}
