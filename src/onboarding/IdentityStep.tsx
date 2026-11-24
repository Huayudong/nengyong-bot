import { type Bot, secretary } from '../../shared/bot'
import { CANDIDATE_Y, candidateX } from './crewPoses'
import { type Hire, IDENTITIES, type Identity } from './identities'
import { StepFooter } from './StepFooter'
import { StepHeading } from './StepHeading'
import { strings } from '../../shared/strings'

const words = strings().onboarding.identity

interface Props {
  boss: Bot
  identity: Identity | null
  hires: Hire[] // the candidates of `identity` that are kept
  error: string | null // why hiring failed last time
  onPick: (identityId: string | null) => void // null: the picked one was clicked again
  onToggleHire: (hireId: string) => void
  onBack: () => void
  onHire: () => void
  onSkip: () => void // hires nobody
}

/** The user's line of work picks five bots to hire; the crew stands in for them and a click lets one go or back. */
export function IdentityStep({ boss, identity, hires, error, onPick, onToggleHire, onBack, onHire, onSkip }: Props) {
  return (
    <>
      <StepHeading top={30} title={words.title} sub={words.lede} />
      <div
        role="group"
        aria-label={words.rolesLabel}
        className="absolute inset-x-0 top-[128px] flex justify-center gap-2"
      >
        {IDENTITIES.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            aria-pressed={candidate.id === identity?.id}
            onClick={() => onPick(candidate.id === identity?.id ? null : candidate.id)}
            className="h-9 rounded-full bg-surface px-4 text-md shadow-card aria-pressed:bg-ink aria-pressed:text-canvas aria-pressed:shadow-none"
          >
            {candidate.label}
          </button>
        ))}
      </div>
      {identity?.hires.map((hire, index) => (
        <button
          key={hire.id}
          type="button"
          aria-pressed={hires.includes(hire)}
          aria-label={words.hireLabel(hire.name, hire.duty)}
          onClick={() => onToggleHire(hire.id)}
          className="group absolute flex h-[138px] w-32 -translate-x-1/2 flex-col items-center justify-end rounded-xl px-1 pb-2 text-center leading-[1.4]"
          style={{ left: `calc(50% + ${candidateX(index)}px)`, top: 280 + CANDIDATE_Y - 36 }}
        >
          <b className="text-sm font-semibold transition-opacity group-aria-[pressed=false]:opacity-40">{hire.name}</b>
          <small className="text-xs text-muted transition-opacity group-aria-[pressed=false]:opacity-40">
            {hire.duty}
          </small>
        </button>
      ))}
      <p className="absolute inset-x-0 text-center text-sm text-muted" style={{ top: identity ? 400 : 262 }}>
        {hintOf(identity, hires, boss)}
      </p>
      {error && (
        <p role="alert" className="absolute inset-x-0 top-[430px] text-center text-sm text-danger">
          {error}
        </p>
      )}
      <StepFooter
        onBack={onBack}
        forwardLabel={words.build}
        onForward={onHire}
        isForwardDisabled={!identity}
        tertiaryLabel={words.skip}
        onTertiary={onSkip}
      />
    </>
  )
}

function hintOf(identity: Identity | null, hires: Hire[], boss: Bot) {
  if (!identity) return words.pickHint
  if (!hires.length) return words.nobody(boss.name, secretary().name)
  return words.hiring(hires.length)
}
