import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { type ReactNode, useRef, useState } from 'react'
import { type Bot, MAIN_BOT, MAIN_BOT_ID, secretary } from '../../shared/bot'
import type { OnboardingChoices } from '../../shared/bridge'
import type { ModelServicesView } from '../../shared/modelServices'
import { ipcErrorMessage } from '../ipcErrorMessage'
import type { Theme } from '../preferences'
import { EASE_SHARP } from '../ui/motion'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useTimeline } from '../ui/useTimeline'
import { BACKGROUND_BEATS, BackgroundStep } from './BackgroundStep'
import { Crew } from './Crew'
import { CREW_SIZE, crewPoses, type MeetPhase, type Spot, type Step } from './crewPoses'
import { IdentityStep } from './IdentityStep'
import { type Hire, IDENTITIES, suggestionsFor } from './identities'
import { MeetStep } from './MeetStep'
import { ModelStep } from './ModelStep'
import { StepHeading } from './StepHeading'
import { TeamStep } from './TeamStep'
import { strings } from '../../shared/strings'

const words = strings().onboarding

const BEATS: Record<Step, readonly number[]> = {
  meet: [300, 700],
  team: [450, 1100],
  background: BACKGROUND_BEATS,
  model: [],
  identity: [],
  handoff: [1300, 950, 150],
}
const FLY_BEAT = 1
const NO_BEATS: readonly number[] = []
const DOTS: Step[] = ['meet', 'team', 'background', 'model', 'identity']
const STEP_SHOWN = {
  opacity: 1,
  y: 0,
  filter: 'blur(0px)',
  transition: { duration: 0.4, delay: 0.14, ease: EASE_SHARP },
}
const STEP_HIDDEN = { opacity: 0, y: 10, filter: 'blur(4px)' }
const STEP_LEAVING = { opacity: 0, y: -6, filter: 'blur(4px)', transition: { duration: 0.18 } }

interface Props {
  modelServices: ModelServicesView | null // null while it is being read
  onConnectModel: (apiKey: string) => Promise<void> // connects DeepSeek with the key, once it is shown to work
  onHire: (choices: OnboardingChoices) => Promise<Bot[]> // the hired bots: the secretary, then the ones asked in order
  onDone: () => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

/** Runs once, before anything else: the boss gets a name, shows what bots do, gets a model, and hires the secretary and a team that fly into the sidebar. */
export function Onboarding({ modelServices, onConnectModel, onHire, onDone, theme, onThemeChange }: Props) {
  const [step, setStep] = useState<Step>('meet')
  const [replays, setReplays] = useState(0)
  const [meetPhase, setMeetPhase] = useState<MeetPhase>('name')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [identityId, setIdentityId] = useState<string | null>(null)
  const [dropped, setDropped] = useState<string[]>([])
  const [hireError, setHireError] = useState<string | null>(null)
  const [hiredIdByCrewId, setHiredIdByCrewId] = useState<Record<string, string>>({})
  const [targets, setTargets] = useState<Record<string, Spot>>({})
  const stageRef = useRef<HTMLDivElement>(null)

  const boss = { ...MAIN_BOT, name: name.trim() || MAIN_BOT.name }
  const identity = IDENTITIES.find((candidate) => candidate.id === identityId) ?? null
  const candidates = identity?.hires ?? []
  const hires = candidates.filter((hire) => !dropped.includes(hire.id))
  const isHired = MAIN_BOT_ID in hiredIdByCrewId
  const beats = step === 'handoff' && !isHired ? NO_BEATS : BEATS[step]
  const beat = useTimeline(`${step}:${replays}:${isHired}`, beats, (landed) => {
    if (step !== 'handoff') return
    if (landed === FLY_BEAT && stageRef.current) setTargets(sidebarSpots(stageRef.current, hiredIdByCrewId))
    if (landed === BEATS.handoff.length) onDone()
  })

  const go = (next: Step) => {
    if (next === 'meet') setMeetPhase('name')
    setStep(next)
  }

  const submitMeet = () => {
    if (meetPhase === 'name') return setMeetPhase('address')
    if (meetPhase === 'address') return setMeetPhase('done')
    go('team')
  }

  const hire = async (team: Hire[], suggestions: string[]) => {
    setHireError(null)
    setStep('handoff')
    try {
      const bots = await onHire({
        bossName: boss.name,
        address: address.trim(),
        hires: team.map(({ id: _crewId, ...look }) => look),
        suggestions,
      })
      const pairs = [secretary(), ...team].flatMap((member, index) =>
        bots[index] ? [[member.id, bots[index].id]] : [],
      )
      setHiredIdByCrewId({ [MAIN_BOT_ID]: MAIN_BOT_ID, ...Object.fromEntries(pairs) })
    } catch (error) {
      const reason = ipcErrorMessage(error)
      setHireError(words.buildFailed(reason))
      setStep('identity')
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'meet':
        return (
          <MeetStep
            beat={beat}
            phase={meetPhase}
            name={name}
            address={address}
            onName={setName}
            onAddress={setAddress}
            onSubmit={submitMeet}
          />
        )
      case 'team':
        return <TeamStep beat={beat} boss={boss} onBack={() => go('meet')} onNext={() => go('background')} />
      case 'background':
        return (
          <BackgroundStep
            beat={beat}
            boss={boss}
            onReplay={() => setReplays((count) => count + 1)}
            onBack={() => go('team')}
            onNext={() => go('model')}
          />
        )
      case 'model':
        return (
          <ModelStep
            services={modelServices}
            onConnect={onConnectModel}
            onBack={() => go('background')}
            onNext={() => go('identity')}
          />
        )
      case 'identity':
        return (
          <IdentityStep
            boss={boss}
            identity={identity}
            hires={hires}
            error={hireError}
            onPick={(id) => {
              setIdentityId(id)
              setDropped([])
            }}
            onToggleHire={(id) =>
              setDropped((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]))
            }
            onBack={() => go('model')}
            onHire={() => void hire(hires, suggestionsFor(identity))}
            onSkip={() => {
              setIdentityId(null)
              void hire([], suggestionsFor(null))
            }}
          />
        )
      case 'handoff':
        return (
          <AnimatePresence>
            {beat === 0 && (
              <motion.div key="assembling" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                <StepHeading top={300} title={words.building} />
              </motion.div>
            )}
          </AnimatePresence>
        )
      default:
        return step satisfies never
    }
  }

  const isLeaving = step === 'handoff' && beat >= FLY_BEAT
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={words.dialogLabel}
      data-leaving={isLeaving || undefined}
      data-landing={(step === 'handoff' && beat === FLY_BEAT) || undefined}
      className="fixed inset-0 z-20 bg-canvas transition-colors duration-500 data-leaving:pointer-events-none data-leaving:bg-canvas/0"
    >
      <div className="drag absolute inset-x-0 top-0 h-[52px]" />
      {DOTS.includes(step) && (
        <div aria-hidden="true" className="absolute top-[22px] left-1/2 flex -translate-x-1/2 gap-1.5">
          {DOTS.map((id) => (
            <span
              key={id}
              data-current={id === step || undefined}
              className="h-1.5 w-1.5 rounded-full bg-line transition-all duration-300 data-current:w-[18px] data-current:bg-ink"
            />
          ))}
        </div>
      )}
      <div className="no-drag absolute top-3 right-3.5 flex items-center gap-1 transition-opacity duration-500 in-data-leaving:opacity-0">
        {(step === 'team' || step === 'background') && (
          <button type="button" onClick={() => go('model')} className="h-[30px] rounded-full px-3 text-sm text-muted">
            {words.skipIntro}
          </button>
        )}
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>
      <div ref={stageRef} className="absolute top-1/2 left-1/2 h-[560px] w-[760px] -translate-x-1/2 -translate-y-1/2">
        <AnimatePresence initial={false}>
          <StepSection key={step}>{renderStep()}</StepSection>
        </AnimatePresence>
        <Crew poses={crewPoses({ step, beat, boss, meetPhase, candidates, hires, targets })} />
      </div>
    </div>
  )
}

// a step on its way out stays on screen a moment; clicking it then would act twice, so it takes no input
function StepSection({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent()
  return (
    <motion.section
      inert={!isPresent}
      className="absolute inset-0 z-[1]"
      initial={STEP_HIDDEN}
      animate={STEP_SHOWN}
      exit={STEP_LEAVING}
    >
      {children}
    </motion.section>
  )
}

function sidebarSpots(stage: HTMLElement, hiredIdByCrewId: Record<string, string>): Record<string, Spot> {
  const box = stage.getBoundingClientRect()
  const centerX = box.left + box.width / 2
  const centerY = box.top + box.height / 2
  return Object.fromEntries(
    Object.entries(hiredIdByCrewId).flatMap(([crewId, botId]) => {
      const avatar = document.querySelector(`[data-sidebar] [data-avatar-of="${botId}"]`)
      if (!avatar) return []
      const spot = avatar.getBoundingClientRect()
      const at = { x: spot.left + spot.width / 2 - centerX, y: spot.top + spot.height / 2 - centerY }
      return [[crewId, { ...at, scale: spot.width / CREW_SIZE }]]
    }),
  )
}
