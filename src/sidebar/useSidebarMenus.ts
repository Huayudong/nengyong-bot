import { type MouseEvent, useState } from 'react'
import type { Bot } from '../../shared/bot'
import type { Section } from '../../shared/sidebar'

export type Editing = { kind: 'bot' | 'section'; id: string } | null

export type MenuTarget = { kind: 'bot'; bot: Bot; canRename: boolean } | { kind: 'section'; section: Section }

export interface Confirmation {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
}

/** Which context menu is open, what is waiting to be confirmed, and what is being renamed. */
export function useSidebarMenus() {
  const [menu, setMenu] = useState<{ x: number; y: number; target: MenuTarget } | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [editing, setEditing] = useState<Editing>(null)

  const open = (event: MouseEvent, target: MenuTarget) => {
    event.preventDefault()
    event.stopPropagation()
    setMenu({ x: event.clientX, y: event.clientY, target })
  }

  return {
    menu,
    confirmation,
    editing,
    setConfirmation,
    setEditing,
    closeMenu: () => setMenu(null),
    openBotMenu: (event: MouseEvent, bot: Bot, canRename = true) => open(event, { kind: 'bot', bot, canRename }),
    openSectionMenu: (event: MouseEvent, section: Section) => open(event, { kind: 'section', section }),
  }
}
