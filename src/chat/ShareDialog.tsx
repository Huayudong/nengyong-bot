import { useId, useRef, useState } from 'react'
import type { Bot } from '../../shared/bot'
import { Dialog } from '../ui/Dialog'
import { elementToPng } from '../ui/elementToPng'
import { Icon } from '../ui/Icon'
import { IconButton } from '../ui/IconButton'
import { saveFile } from '../ui/saveFile'
import { Segmented } from '../ui/Segmented'
import { COPIED_LABEL, useCopy } from '../ui/useCopy'
import { useElementSize } from '../ui/useElementSize'
import { useFlash } from '../ui/useFlash'
import type { SelectableMessage } from './selection'
import { type CardLook, ShareCard } from './ShareCard'
import { strings } from '../../shared/strings'

const EXPORT_SCALE = 3 // a 420 px card becomes 1260 px wide: sharp when zoomed in on a phone
const LOOKS = [
  { id: 'bot', label: strings().chat.share.looks.bot },
  { id: 'plain', label: strings().chat.share.looks.plain },
  { id: 'dark', label: strings().chat.share.looks.dark },
] as const satisfies readonly { id: CardLook; label: string }[]

interface Props {
  bot: Bot
  messages: SelectableMessage[]
  bubbleColor?: string
  onClose: () => void
}

/** The picked messages as an image: a preview of the card, its look, and copying or saving it as a PNG. */
export function ShareDialog({ bot, messages, bubbleColor, onClose }: Props) {
  const words = strings().chat.share
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const size = useElementSize(cardRef)
  const [look, setLook] = useState<CardLook>('bot')
  const [copied, copy] = useCopy()
  const [saveFailed, flashSaveFailed] = useFlash<true>()
  const image = () =>
    cardRef.current ? elementToPng(cardRef.current, EXPORT_SCALE) : Promise.reject(new Error(words.drawFailed))

  return (
    <Dialog
      labelledBy={titleId}
      onClose={onClose}
      className="grid h-[min(720px,calc(100vh-48px))] w-[860px] max-w-[calc(100vw-48px)] grid-cols-[1fr_272px] overflow-hidden rounded-2xl bg-surface"
    >
      <div className="flex items-start justify-center overflow-y-auto bg-side px-6 py-8">
        <div className="shrink-0 overflow-hidden rounded-xl shadow-pop">
          <ShareCard ref={cardRef} bot={bot} messages={messages} look={look} bubbleColor={bubbleColor} />
        </div>
      </div>
      <div className="flex flex-col gap-5 p-5">
        <div className="-mr-2 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-semibold">
            {words.title}
          </h2>
          <IconButton icon="close" label={words.close} onClick={onClose} />
        </div>
        <Segmented label={words.style} options={LOOKS} value={look} onChange={setLook} />
        <dl className="grid gap-1.5 text-sm text-soft">
          <div className="flex justify-between">
            <dt>{words.content}</dt>
            <dd className="text-ink">{words.messageCount(messages.length)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{words.size}</dt>
            <dd className="text-ink tabular-nums">
              {size && `${size.width * EXPORT_SCALE} × ${size.height * EXPORT_SCALE}`}
            </dd>
          </div>
        </dl>
        <div className="mt-auto grid gap-2">
          <button
            type="button"
            onClick={() => copy(image())}
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-ink text-md font-medium text-canvas"
          >
            <Icon name={copied === 'done' ? 'check' : 'copy'} size={17} />
            {copied ? COPIED_LABEL[copied] : words.copyImage}
          </button>
          <button
            type="button"
            onClick={() =>
              image().then(
                (blob) => saveFile(blob, words.fileName(bot.name)),
                () => flashSaveFailed(true),
              )
            }
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-bubble text-md"
          >
            <Icon name="download" size={17} />
            {saveFailed ? words.saveFailed : words.saveImage}
          </button>
          <p className="text-center text-xs text-muted">{words.pasteHint}</p>
        </div>
      </div>
    </Dialog>
  )
}
