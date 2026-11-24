import { createContext, type MouseEvent, type PointerEvent, useContext } from 'react'
import type { Bot } from '../../shared/bot'
import type { Section, SidebarState } from '../../shared/sidebar'
import type { Thread } from '../harnessState'
import type { BotStatus } from './botStatus'
import { renameBot } from './sidebarState'
import type { Editing } from './useSidebarMenus'

interface SidebarContextValue {
  sidebar: SidebarState
  update: (change: (state: SidebarState) => SidebarState) => void
  activeId: string
  select: (botId: string) => void
  thread: (botId: string) => Thread
  statusOf: (botId: string) => BotStatus
  peek: (botId: string, entry: Element) => void // shows its status card beside the entry
  unpeek: () => void
  editing: Editing
  setEditing: (editing: Editing) => void
  openBotMenu: (event: MouseEvent, bot: Bot, canRename?: boolean) => void
  openSectionMenu: (event: MouseEvent, section: Section) => void
}

/** What the parts of the sidebar share, so none of them needs a bundle of callbacks handed down. */
export const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar(): SidebarContextValue {
  const value = useContext(SidebarContext)
  if (!value) throw new Error('useSidebar needs a <Sidebar> above it')
  return value
}

/** What every kind of bot entry (rail icon, pinned tile, list row) knows and does about its bot. */
export function useBotEntry(bot: Bot) {
  const { sidebar, update, activeId, select, statusOf, peek, unpeek, editing, setEditing } = useSidebar()
  return {
    isActive: bot.id === activeId,
    unread: sidebar.unread[bot.id] ?? 0,
    status: statusOf(bot.id),
    isEditing: editing?.kind === 'bot' && editing.id === bot.id,
    select() {
      unpeek()
      select(bot.id)
    },
    peekHandlers: {
      onPointerEnter: (event: PointerEvent) => peek(bot.id, event.currentTarget),
      onPointerLeave: unpeek,
    },
    // `null` means the rename was cancelled
    rename(name: string | null) {
      if (name !== null) update((state) => renameBot(state, bot.id, name))
      setEditing(null)
    },
  }
}
