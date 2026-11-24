import { AnimatePresence, motion } from 'motion/react'
import { BOT_NAME_MAX, MAIN_BOT } from '../../shared/bot'
import { ADDRESS_MAX } from '../../shared/bridge'
import { IconButton } from '../ui/IconButton'
import { EASE_SHARP } from '../ui/motion'
import type { MeetPhase } from './crewPoses'
import { StepFooter } from './StepFooter'
import { StepHeading } from './StepHeading'
import { strings } from '../../shared/strings'

const words = strings().onboarding.meet

const QUESTIONS = {
  name: {
    title: words.nameTitle,
    placeholder: words.nameHint(MAIN_BOT.name),
    maxLength: BOT_NAME_MAX,
  },
  address: {
    title: words.addressTitle,
    placeholder: words.addressPlaceholder,
    maxLength: ADDRESS_MAX,
  },
}
const READY_BEAT = 2

interface Props {
  beat: number
  phase: MeetPhase
  name: string
  address: string
  onName: (name: string) => void
  onAddress: (address: string) => void
  onSubmit: () => void // answers the question on screen, or moves on once both are answered
}

/** The boss wakes up and asks for its name and how to address the user; empty answers keep the defaults. */
export function MeetStep({ beat, phase, name, address, onName, onAddress, onSubmit }: Props) {
  const isReady = beat >= READY_BEAT
  const shownName = name.trim() || MAIN_BOT.name
  const question = phase === 'done' ? null : QUESTIONS[phase]
  const subs: Record<MeetPhase, string> = {
    name: words.intro,
    address: words.named(shownName),
    done: words.nextUp,
  }
  return (
    <>
      <motion.div
        data-default={!name.trim() || undefined}
        className="absolute top-[222px] left-1/2 h-[26px] max-w-[260px] -translate-x-1/2 truncate rounded-full bg-surface px-3 text-sm leading-[26px] font-semibold shadow-card data-default:font-normal data-default:text-muted"
        initial={false}
        animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : 6 }}
      >
        {shownName}
      </motion.div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: isReady ? 1 : 0, y: 0 }}
          exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
        >
          <StepHeading top={266} title={question?.title ?? words.hello(address.trim())} sub={subs[phase]} />
        </motion.div>
      </AnimatePresence>
      <motion.form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="absolute top-[370px] left-1/2 -ml-[200px] flex w-[400px] items-center gap-1 rounded-3xl bg-surface py-[5px] pr-[5px] pl-[18px] shadow-card"
        initial={false}
        animate={question ? { opacity: isReady ? 1 : 0, y: 0, scale: 1 } : { opacity: 0, y: -40, scale: 0.85 }}
        transition={{ duration: 0.4, ease: EASE_SHARP }}
      >
        {question && (
          <input
            key={phase}
            autoFocus
            aria-label={question.title}
            placeholder={question.placeholder}
            maxLength={question.maxLength}
            value={phase === 'name' ? name : address}
            onChange={(event) => (phase === 'name' ? onName : onAddress)(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted/70"
          />
        )}
        <IconButton icon="arrowUp" iconSize={20} label={words.ok} variant="solid" type="submit" />
      </motion.form>
      <StepFooter forwardLabel={strings().onboarding.next} onForward={onSubmit} />
    </>
  )
}
