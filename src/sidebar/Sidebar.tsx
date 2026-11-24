import { AnimatePresence, motion } from 'motion/react'
import { type KeyboardEvent, type PointerEvent, useRef, useState } from 'react'
import { type Bot, newBotId } from '../../shared/bot'
import type { SidebarState } from '../../shared/sidebar'
import { CreateBotDialog } from '../bot/CreateBotDialog'
import type { Thread } from '../harnessState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ContextMenu } from '../ui/ContextMenu'
import { PANEL_TRANSITION } from '../ui/motion'
import { BotStatusCard, type CardAnchor } from './BotStatusCard'
import { botStatusOf } from './botStatus'
import { SidebarContext } from './SidebarContext'
import { SidebarList } from './SidebarList'
import { SidebarRail } from './SidebarRail'
import { resolveDrag, resolveKey, SIDEBAR_MAX, type SidebarLayout } from './sidebarLayout'
import { sidebarMenu } from './sidebarMenu'
import { createBot } from './sidebarState'
import { useSidebarMenus } from './useSidebarMenus'
import { strings } from '../../shared/strings'

interface Props {
  activeId: string
  collapsed: boolean
  width: number
  isMac: boolean
  sidebar: SidebarState
  thread: (botId: string) => Thread
  onSidebarChange: (update: (state: SidebarState) => SidebarState) => void
  onSelect: (id: string) => void
  onToggle: () => void
  onLayout: (next: SidebarLayout) => void
  onUsage: () => void
  onSettings: () => void
}

/** The icon rail and the bot list beside it: the list's width (drag or keyboard), folding it away, and the overlays their parts open. */
export function Sidebar({
  activeId,
  collapsed,
  width,
  isMac,
  sidebar,
  thread,
  onSidebarChange,
  onSelect,
  onToggle,
  onLayout,
  onUsage,
  onSettings,
}: Props) {
  const menus = useSidebarMenus()
  const [creating, setCreating] = useState(false)
  const [peeking, setPeeking] = useState<{ botId: string; anchor: CardAnchor } | null>(null)
  const statusOf = (botId: string) => botStatusOf(thread(botId), sidebar.seenAt[botId] ?? 0, botId === activeId)
  const peekedBot = peeking && sidebar.bots.find((bot) => bot.id === peeking.botId)
  const createAndOpen = (bot: Pick<Bot, 'name' | 'shape' | 'color'>) => {
    const id = newBotId()
    onSidebarChange((state) => createBot(state, { id, ...bot }))
    onSelect(id)
  }

  const dragStart = useRef<{ x: number; width: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  // keep the collapse/expand morph animated even mid-drag; plain width changes follow the pointer instantly
  const [morphing, setMorphing] = useState(false)
  const [prevCollapsed, setPrevCollapsed] = useState(collapsed)
  if (prevCollapsed !== collapsed) {
    setPrevCollapsed(collapsed)
    setMorphing(true)
  }

  const listWidth = collapsed ? 0 : width

  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault() // no text selection while dragging
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragStart.current = { x: e.clientX, width: listWidth }
    setDragging(true)
  }
  const drag = (e: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (start) onLayout(resolveDrag(collapsed, start.width + e.clientX - start.x))
  }
  const endDrag = () => {
    dragStart.current = null
    setDragging(false)
  }
  const nudge = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const next = resolveKey(collapsed, width, e.key)
    if (!next) return
    e.preventDefault()
    onLayout(next)
  }

  return (
    <SidebarContext
      value={{
        sidebar,
        update: onSidebarChange,
        activeId,
        select: onSelect,
        thread,
        statusOf,
        peek: (botId, entry) => setPeeking({ botId, anchor: cardAnchor(entry) }),
        unpeek: () => setPeeking(null),
        editing: menus.editing,
        setEditing: menus.setEditing,
        openBotMenu: menus.openBotMenu,
        openSectionMenu: menus.openSectionMenu,
      }}
    >
      <aside data-sidebar className="relative flex shrink-0 border-r border-line bg-side">
        <SidebarRail
          collapsed={collapsed}
          isMac={isMac}
          onToggle={onToggle}
          onUsage={onUsage}
          onSettings={onSettings}
        />
        <AnimatePresence initial={false}>
          {!collapsed && (
            // clip here, not on the aside, so the resize handle can straddle the border
            <motion.div
              initial={{ width: 0 }}
              animate={{ width }}
              exit={{ width: 0, transition: PANEL_TRANSITION }}
              transition={dragging && !morphing ? { duration: 0 } : PANEL_TRANSITION}
              onAnimationComplete={() => setMorphing(false)}
              className="h-full overflow-hidden"
            >
              {/* fixed-width inner box so text never reflows while the outer width animates */}
              {/* the list's frame starts under the 60px top bar: on recent macOS the window buttons reach across the rail's edge */}
              <div
                className="relative h-full before:pointer-events-none before:absolute before:inset-x-0 before:top-[60px] before:bottom-0 before:border-t before:border-l before:border-line"
                style={{ width }}
              >
                <SidebarList onCreate={() => setCreating(true)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={strings().sidebar.rail.resize}
          tabIndex={0}
          aria-valuenow={listWidth}
          aria-valuemin={0}
          aria-valuemax={SIDEBAR_MAX}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={nudge}
          // 12px invisible hit area centered on the border; a 2px accent line only on keyboard focus
          className="group absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize touch-none outline-none"
        >
          <span className="absolute inset-y-0 left-[5px] w-0.5 bg-accent opacity-0 group-focus-visible:opacity-100" />
        </div>
        <AnimatePresence>
          {peeking && peekedBot && !menus.menu && (
            <BotStatusCard
              key={peeking.botId}
              bot={peekedBot}
              thread={thread(peeking.botId)}
              status={statusOf(peeking.botId)}
              anchor={peeking.anchor}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {menus.menu && (
            <ContextMenu
              key={`${menus.menu.x},${menus.menu.y}`}
              x={menus.menu.x}
              y={menus.menu.y}
              {...sidebarMenu(sidebar, menus.menu.target, {
                update: onSidebarChange,
                setEditing: menus.setEditing,
                setConfirmation: menus.setConfirmation,
              })}
              onClose={menus.closeMenu}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {menus.confirmation && <ConfirmDialog {...menus.confirmation} onClose={() => menus.setConfirmation(null)} />}
        </AnimatePresence>
        <AnimatePresence>
          {creating && <CreateBotDialog onCreate={createAndOpen} onClose={() => setCreating(false)} />}
        </AnimatePresence>
      </aside>
    </SidebarContext>
  )
}

const CARD_GAP = 8

/** Beside the sidebar, level with the entry: hanging down from its top in the upper half of the window, standing on its bottom in the lower. */
function cardAnchor(entry: Element): CardAnchor {
  const box = entry.getBoundingClientRect()
  const left = (entry.closest('[data-sidebar]') ?? entry).getBoundingClientRect().right + CARD_GAP
  return box.top < window.innerHeight / 2 ? { left, top: box.top } : { left, bottom: window.innerHeight - box.bottom }
}
