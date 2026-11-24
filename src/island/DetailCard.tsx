import { useState } from 'react'
import type { Bot } from '../../shared/bot'
import { strings } from '../../shared/strings'
import { BotAvatar } from '../bot/BotAvatar'
import { Icon } from '../ui/Icon'
import { DebugToggle } from './DebugToggle'
import { LevelBadge } from './LevelBadge'
import { LevelGuide } from './LevelGuide'
import { type Trust, tierOf } from '../../shared/trust'
import { TrustProgress } from './TrustProgress'
import { TrustRing } from './TrustRing'

interface Props {
  bot: Bot
  trust: Trust
  flowCount: number
  onOpenFlows: () => void
  onDebugChange: (isDebug: boolean) => void
}

/** The island opened up: the bot's level, how far to the next one, and the flows it has learned. */
export function DetailCard({ bot, trust, flowCount, onOpenFlows, onDebugChange }: Props) {
  const tier = tierOf(trust.level)
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  return (
    <div className="w-[360px] p-4">
      <div className="flex items-center gap-3">
        <TrustRing trust={trust} size={48}>
          <BotAvatar bot={bot} size={30} />
        </TrustRing>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold">{bot.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-white/60">
            <button
              type="button"
              aria-label={strings().island.detail.levelGuide(trust.level)}
              aria-expanded={isGuideOpen}
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="rounded-full"
            >
              <LevelBadge level={trust.level} />
            </button>
            {tier.name}
          </div>
        </div>
        <DebugToggle isDebug={false} onChange={onDebugChange} />
      </div>
      {isGuideOpen ? (
        <LevelGuide trust={trust} onBack={() => setIsGuideOpen(false)} className="mt-4" />
      ) : (
        <>
          <TrustProgress trust={trust} className="mt-4" />
          {flowCount > 0 && (
            <button
              type="button"
              onClick={onOpenFlows}
              className="mt-4 flex w-full items-center gap-2.5 rounded-xl bg-white/8 px-3 py-2.5 text-left text-md"
            >
              <Icon name="flow" size={18} />
              <span className="flex-1">{strings().island.detail.knowsFlows(flowCount)}</span>
              <Icon name="chevron" size={16} />
            </button>
          )}
        </>
      )}
    </div>
  )
}
