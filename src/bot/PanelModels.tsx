import type { BotModels, Entry } from '../../shared/bridge'
import { ModelLogo } from '../settings/ModelLogo'
import { Icon } from '../ui/Icon'
import { PanelCard, PanelSectionTitle } from './PanelCard'
import { strings } from '../../shared/strings'

/** The models a bot works with, read only: the user changes them by asking the bot in its chat, never here. */
export function PanelModels({ models, entries }: { models: BotModels; entries: Entry[] }) {
  const words = strings().bot.models
  const main = models.main ?? words.notSet
  return (
    <>
      <PanelSectionTitle>{words.title}</PanelSectionTitle>
      <PanelCard>
        <ul aria-label={words.title} className="divide-y divide-line">
          <ModelRow label={words.chat} model={models.chat?.model ?? main} note={chatNote(models, entries)} />
          <ModelRow label={words.tasks} model={models.tasks?.model ?? main} note={tasksNote(models)} />
        </ul>
        <p className="border-t border-line px-3 py-2.5 text-xs text-muted">{words.switchHint}</p>
      </PanelCard>
    </>
  )
}

function ModelRow({ label, model, note }: { label: string; model: string; note: string }) {
  return (
    <li className="flex items-center gap-3 p-3 leading-[1.35]">
      <ModelLogo model={model} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-md text-ink">
          {label} · <span className="font-mono">{model}</span>
        </span>
        <small className="truncate text-sm text-muted">{note}</small>
      </span>
    </li>
  )
}

function chatNote({ main, chat }: BotModels, entries: Entry[]): string {
  const words = strings().bot.models
  if (!chat) return words.followsMain
  if (chat.isGone) return words.accountGone(main ?? '')
  const lastReply = entries.findLast((entry) => entry.kind === 'bot')
  if (lastReply?.kind === 'bot' && lastReply.fallbackFrom === chat.model) return words.fellBack(main ?? '')
  return words.askedInChat
}

function tasksNote({ main, tasks }: BotModels): string {
  const words = strings().bot.models
  if (!tasks) return words.tasksFollowMain
  if (tasks.isGone) return words.accountGone(main ?? '')
  return words.tasksAskedInChat
}

/** The model a task, routine or flow is set to, where its row says what it runs on: no tag means the 后台任务 row's. */
export function ModelTag({ model }: { model: string }) {
  return (
    <span className="mt-1 flex max-w-full items-center gap-1 self-start rounded-sm bg-bubble py-0.5 pr-1.5 pl-1 text-xs text-soft">
      <Icon name="cube" size={13} />
      <span className="truncate font-mono">{model}</span>
    </span>
  )
}
