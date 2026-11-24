import { motion } from 'motion/react'
import type { Bot } from '../../shared/bot'
import { StatusAvatar } from './StatusAvatar'
import { sidebarView } from '../sidebarView'
import { Icon, type IconName } from '../ui/Icon'
import { useBotEntry, useSidebar } from './SidebarContext'
import { PANEL_TRANSITION } from '../ui/motion'
import { COLLAPSED_RAIL_WIDTH, RAIL_WIDTH } from './sidebarLayout'
import { UnreadBadge } from './UnreadBadge'
import { strings } from '../../shared/strings'

interface Props {
  collapsed: boolean
  isMac: boolean
  onToggle: () => void
  onUsage: () => void
  onSettings: () => void
}

/** The icon column at the window's edge: folds the bot list, opens 用量 and 设置, and holds the bots while the list is folded. */
export function SidebarRail({ collapsed, isMac, onToggle, onUsage, onSettings }: Props) {
  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_RAIL_WIDTH : RAIL_WIDTH }}
      transition={PANEL_TRANSITION}
      className="flex h-full shrink-0 flex-col items-center gap-1"
    >
      {isMac === false ? (
        <div className="h-3 w-full shrink-0" />
      ) : (
        // the macOS window buttons sit over this bar (trafficLightPosition in electron/main.ts)
        <div
          data-collapsed={collapsed || undefined}
          className="drag relative h-[60px] w-full shrink-0 after:absolute after:inset-x-0 after:top-full after:border-t after:border-line after:transition-opacity after:duration-300 data-collapsed:after:opacity-0"
        />
      )}
      <RailButton
        icon={collapsed ? 'sidebar' : 'sidebarOpen'}
        label={collapsed ? strings().sidebar.rail.show : strings().sidebar.rail.hide}
        isExpanded={!collapsed}
        onClick={onToggle}
      />
      <RailButton icon="chart" label={strings().sidebar.rail.usage} onClick={onUsage} />
      {collapsed ? <RailBots /> : <div className="flex-1" />}
      <div className="pb-4">
        <RailButton icon="gear" label={strings().sidebar.rail.settings} onClick={onSettings} />
      </div>
    </motion.div>
  )
}

interface RailButtonProps {
  icon: IconName
  label: string
  isExpanded?: boolean
  onClick: () => void
}

/** An icon button whose name shows in a bubble to its right once the pointer rests on it, or keyboard focus lands on it. */
function RailButton({ icon, label, isExpanded, onClick }: RailButtonProps) {
  return (
    <span className="group/tip relative grid shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-expanded={isExpanded}
        onClick={onClick}
        className="grid size-11 place-items-center rounded-lg text-soft"
      >
        <Icon name={icon} size={22} />
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-full z-20 ml-2 -translate-y-1/2 rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-canvas opacity-0 shadow-pop transition-opacity duration-150 group-hover/tip:opacity-100 group-hover/tip:delay-500 group-has-[:focus-visible]/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}

/** One icon per visible bot, grouped like the full list. */
function RailBots() {
  const view = sidebarView(useSidebar().sidebar)
  const groups = [view.pinned, ...view.sections.map((section) => section.bots), view.ungrouped].filter(
    (bots) => bots.length > 0,
  )
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto pb-2"
    >
      {groups.map((bots) => (
        <div key={bots[0].id} className="flex flex-col items-center gap-1">
          <hr className="my-1.5 w-10 border-line" />
          {bots.map((bot) => (
            <RailBot key={bot.id} bot={bot} />
          ))}
        </div>
      ))}
    </motion.nav>
  )
}

function RailBot({ bot }: { bot: Bot }) {
  const { openBotMenu } = useSidebar()
  const entry = useBotEntry(bot)
  return (
    <button
      aria-label={bot.name}
      aria-current={entry.isActive}
      onClick={entry.select}
      onContextMenu={(event) => openBotMenu(event, bot, false)} // no room to rename in the rail
      {...entry.peekHandlers}
      className="group relative grid size-13 place-items-center rounded-lg transition-colors duration-150 aria-current:bg-hover"
    >
      <StatusAvatar bot={bot} size={40} dotSize={16} status={entry.status} />
      <UnreadBadge count={entry.unread} className="absolute top-2 right-2" />
    </button>
  )
}
