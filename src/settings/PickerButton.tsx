import { AnimatePresence } from 'motion/react'
import { type MouseEvent, type ReactNode, useState } from 'react'
import { ipcErrorMessage } from '../ipcErrorMessage'
import { ContextMenu, type MenuEntry } from '../ui/ContextMenu'
import { Icon } from '../ui/Icon'
import { strings } from '../../shared/strings'

interface Props {
  menuLabel: string
  loadItems: () => Promise<MenuEntry[]> // read when the menu opens, so it shows what there is now
  children: ReactNode // the value it is set to
}

/** The value at the right end of a settings row; pressing it opens a menu of what else it can be. */
export function PickerButton({ menuLabel, loadItems, children }: Props) {
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const open = async (event: MouseEvent<HTMLButtonElement>) => {
    if (isLoading) return
    const button = event.currentTarget
    const { left, bottom } = button.getBoundingClientRect()
    setIsLoading(true)
    const items = await loadItems().catch((error): MenuEntry[] => [
      {
        label: strings().models.picker.loadFailed(ipcErrorMessage(error)),
        disabled: true,
      },
    ])
    setIsLoading(false)
    // the user may have gone on to something else while it read; a menu then would open over that
    if (document.activeElement === button) setMenu({ x: left, y: bottom + 4, items })
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        aria-busy={isLoading}
        onClick={open}
        className="flex h-9 max-w-[260px] shrink-0 items-center gap-2 rounded-md border border-line bg-surface pr-2.5 pl-2 text-sm aria-busy:cursor-progress"
      >
        {children}
        <span className="text-muted">
          <Icon name="down" size={14} />
        </span>
      </button>
      <AnimatePresence>
        {menu && (
          <ContextMenu
            key={`${menu.x},${menu.y}`}
            x={menu.x}
            y={menu.y}
            items={menu.items}
            label={menuLabel}
            onClose={() => setMenu(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/** The menu of a setting that is not built yet: pressing its picker says so. */
export const COMING_SOON: MenuEntry[] = [{ label: strings().models.picker.comingSoon, icon: 'clock' }]
