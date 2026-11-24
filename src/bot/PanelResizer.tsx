import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { z } from 'zod'
import { strings } from '../../shared/strings'

const PANEL_MIN = 336
const PANEL_DEFAULT = 336
// the 12px gap between the two thresholds stops flicker at the boundary
const CLOSE_BELOW = 296
const REOPEN_FROM = 308
const MAIN_MIN = 440
const KEY_STEP = 20

export const PanelWidth = z
  .number()
  .transform((width) => Math.max(PANEL_MIN, Math.round(width)))
  .catch(PANEL_DEFAULT)

export const panelMaxWidth = (windowWidth: number, sidebarWidth: number) =>
  Math.max(PANEL_MIN, windowWidth - sidebarWidth - MAIN_MIN)

/** The panel mid-drag: closing slides it away now and closes it on release; width stays at the last open width meanwhile. */
export interface LivePanel {
  width: number
  isClosing: boolean
}

function resolvePanelDrag(live: LivePanel, pointerWidth: number, maxWidth: number): LivePanel {
  const isClosing = pointerWidth < (live.isClosing ? REOPEN_FROM : CLOSE_BELOW)
  if (isClosing) return { ...live, isClosing }
  return { width: Math.round(Math.min(maxWidth, Math.max(PANEL_MIN, pointerWidth))), isClosing }
}

interface Props {
  width: number
  maxWidth: number
  onLive: (live: LivePanel | null) => void // null = drag finished
  onCommit: (width: number) => void
  onClose: () => void
}

/** Left-edge handle of the right panel: 10px hit area, hairline that darkens on hover. */
export function PanelResizer({ width, maxWidth, onLive, onCommit, onClose }: Props) {
  const drag = useRef<{ x: number; startWidth: number; live: LivePanel } | null>(null)

  const start = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = { x: e.clientX, startWidth: width, live: { width, isClosing: false } }
    onLive(drag.current.live)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const active = drag.current
    if (!active) return
    active.live = resolvePanelDrag(active.live, active.startWidth - (e.clientX - active.x), maxWidth) // handle sits on the left: dragging left widens
    onLive(active.live)
  }
  const end = () => {
    const active = drag.current
    drag.current = null
    onLive(null)
    if (!active) return
    if (active.live.isClosing) onClose()
    else onCommit(active.live.width)
  }
  const nudge = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: KEY_STEP, ArrowRight: -KEY_STEP }[e.key]
    if (!step) return
    e.preventDefault()
    onCommit(Math.min(maxWidth, Math.max(PANEL_MIN, width + step)))
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={strings().bot.panel.resize}
      aria-valuenow={width}
      aria-valuemin={PANEL_MIN}
      aria-valuemax={maxWidth}
      tabIndex={0}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={nudge}
      className="group absolute inset-y-0 left-0 z-20 w-2.5 cursor-col-resize touch-none outline-none"
    >
      <span className="absolute inset-y-0 left-0 w-px bg-line transition-colors duration-150 group-hover:bg-ink/25 group-focus-visible:bg-accent" />
    </div>
  )
}
