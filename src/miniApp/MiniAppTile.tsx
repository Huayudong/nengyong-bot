import { PALETTE } from '../../shared/bot'
import type { MiniApp } from '../../shared/miniApp'
import { Icon } from '../ui/Icon'

const colorById: Record<string, string> = Object.fromEntries(PALETTE.map((color) => [color.id, color.value]))

/** A mini app's icon on its colour, the way an avatar stands for a bot: the colours are illustration, not theme. */
export function MiniAppTile({ app, size }: { app: Pick<MiniApp, 'icon' | 'color'>; size: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center text-white"
      style={{ width: size, height: size, borderRadius: size * 0.28, background: colorById[app.color] }}
    >
      <Icon name={app.icon} size={Math.round(size * 0.6)} />
    </span>
  )
}
