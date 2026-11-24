import { type BrowserWindow, Notification } from 'electron'
import type { HarnessEvent } from '../shared/bridge'
import { strings } from '../shared/strings'
import { plainText } from '../shared/plainText'

const BODY_MAX_CHARS = 140

type AppWindow = Pick<BrowserWindow, 'isFocused' | 'isMinimized' | 'restore' | 'show' | 'focus'>

interface NotifierOptions {
  window: () => AppWindow | null
  botName: (botId: string) => string
  onOpen: (botId: string) => void
}

/** A system notification when a bot ends a turn with a reply while the app is in the background; a click opens that bot. */
export function createNotifier({ window, botName, onOpen }: NotifierOptions) {
  const replies = new Map<string, string>() // per bot: the last message of the turn in progress
  // per bot: the newest one; an unreferenced notification can be collected and lose its click
  const shown = new Map<string, Notification>()

  function turnEnded(botId: string) {
    const reply = replies.get(botId)
    replies.delete(botId)
    if (reply === undefined || window()?.isFocused() !== false || !Notification.isSupported()) return
    shown.get(botId)?.close()
    const notification = new Notification({ title: botName(botId), body: notificationBody(reply) })
    notification.on('click', () => {
      const current = window()
      if (!current) return
      if (current.isMinimized()) current.restore()
      current.show()
      current.focus()
      onOpen(botId)
    })
    shown.set(botId, notification)
    notification.show()
  }

  return (event: HarnessEvent) => {
    switch (event.kind) {
      case 'entry':
        if (event.entry.kind === 'bot') replies.set(event.botId, event.entry.text)
        return
      case 'busy':
        if (!event.busy) turnEnded(event.botId)
        return
      default:
        return
    }
  }
}

function notificationBody(reply: string): string {
  const chars = [...plainText(reply)]
  if (!chars.length) return strings().main.emptyReply
  return chars.length > BODY_MAX_CHARS ? `${chars.slice(0, BODY_MAX_CHARS - 1).join('')}…` : chars.join('')
}
