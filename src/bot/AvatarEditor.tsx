import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import type { Bot } from '../../shared/bot'
import type { OutfitId } from '../../shared/outfit'
import { strings } from '../../shared/strings'
import { Icon } from '../ui/Icon'
import { POP } from '../ui/motion'
import { Segmented } from '../ui/Segmented'
import { useLightDismiss } from '../ui/useLightDismiss'
import { usePastedImage } from '../ui/usePastedImage'
import { AvatarUpload } from './AvatarUpload'
import { type AvatarCandidate, encodeAvatar, readAvatarFile } from './avatarImage'
import { BotAvatar } from './BotAvatar'
import { type Look, LookPicker } from './LookPicker'
import { OutfitPicker } from './OutfitPicker'

type Source = 'look' | 'upload' | 'outfit'

interface Props {
  bot: Bot
  level: number // its trust level: what the outfit page has unlocked
  onPick: (look: Look) => void
  onPickAvatar: (avatar: string | undefined) => void
  onPickOutfit: (outfit: OutfitId[]) => void
}

/** The panel's avatar: pressing it opens the shape and colour picker, the uploader or the outfits, and every choice applies at once.
 * The popover may grow past the panel's padding (`cqw`: the panel is the container), not past its edge. */
export function AvatarEditor({ bot, level, onPick, onPickAvatar, onPickOutfit }: Props) {
  const words = strings().bot.avatar
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState<Source>(bot.avatar ? 'upload' : 'look')
  const [candidate, setCandidate] = useState<AvatarCandidate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const readSequence = useRef(0)
  const ref = useRef<HTMLDivElement>(null)
  useLightDismiss(ref, isOpen, close)
  usePastedImage(isOpen, (file) => {
    setSource('upload')
    reset()
    void load(file)
  })

  function reset() {
    readSequence.current += 1
    setCandidate(null)
    setError(null)
  }

  function close() {
    setIsOpen(false)
    reset()
  }

  function toggle() {
    if (isOpen) return close()
    setSource(bot.avatar ? 'upload' : 'look')
    reset()
    setIsOpen(true)
  }

  async function load(file: File) {
    const sequence = ++readSequence.current
    try {
      const next = await readAvatarFile(file)
      if (readSequence.current === sequence) setCandidate(next)
    } catch (problem) {
      if (readSequence.current === sequence) {
        setError(problem instanceof Error ? problem.message : words.errors.unreadable)
      }
    }
  }

  async function save() {
    if (!candidate) return
    try {
      onPickAvatar(await encodeAvatar(candidate))
      close()
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : words.errors.unreadable)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={words.change}
        aria-expanded={isOpen}
        title={words.changeLook}
        onClick={toggle}
        className="group/avatar relative grid place-items-center rounded-full bg-none"
      >
        <span className="flex transition-[filter] duration-150 group-hover/avatar:brightness-30 group-focus-visible/avatar:brightness-30">
          <BotAvatar bot={bot} size={64} />
        </span>
        <span className="absolute inset-0 grid place-items-center text-side opacity-0 transition-opacity duration-150 group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100">
          <Icon name="pencil" />
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label={words.changeLook}
            {...POP}
            style={{ transformOrigin: 'top center' }}
            className="absolute top-[calc(100%+6px)] left-1/2 z-10 flex w-[296px] max-w-[calc(100cqw+24px)] -translate-x-1/2 flex-col gap-3 rounded-xl bg-surface p-3 shadow-pop"
          >
            <Segmented
              label={words.source}
              options={[
                { id: 'look', label: words.tabs.look },
                { id: 'upload', label: words.tabs.upload },
                { id: 'outfit', label: words.tabs.outfit },
              ]}
              value={source}
              onChange={(next) => {
                if (next === source) return
                setSource(next)
                reset()
              }}
            />
            {source === 'look' && <LookPicker compact look={{ shape: bot.shape, color: bot.color }} onPick={onPick} />}
            {source === 'outfit' && <OutfitPicker bot={bot} level={level} onPick={onPickOutfit} />}
            {source === 'upload' && (
              <AvatarUpload
                current={bot.avatar}
                candidate={candidate}
                error={error}
                onFile={(file) => void load(file)}
                onCrop={(crop) => setCandidate((current) => (current ? { ...current, crop } : current))}
                onCancel={reset}
                onSave={() => void save()}
                onRemove={() => {
                  onPickAvatar(undefined)
                  close()
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
