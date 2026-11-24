import { z } from 'zod'

/** How wide the bot list beside the icon rail is: folded away, or at a width the user chose. */
export type SidebarLayout = { collapsed: true } | { collapsed: false; width: number }

export const RAIL_WIDTH = 60
// folded, the rail alone holds the macOS window buttons, which span x 16–76 (trafficLightPosition in electron/main.ts)
export const COLLAPSED_RAIL_WIDTH = 92
export const SIDEBAR_MAX = 392
// the narrowest list whose search field (width minus 80px of top-bar chrome) keeps the filter chips whole
const SIDEBAR_MIN = 260
const SIDEBAR_DEFAULT = 288
// the 12px gap between the two thresholds stops flicker at the boundary
const COLLAPSE_BELOW = 216
const EXPAND_FROM = 228
const KEY_STEP = 20

const clampWidth = (width: number) => Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, width)))

/** The stored width, back inside its limits. */
export const SidebarWidth = z.number().transform(clampWidth).catch(SIDEBAR_DEFAULT)

/** Map the width the pointer asks for to a layout: collapse below 216, re-expand only from 228. */
export function resolveDrag(collapsed: boolean, pointerWidth: number): SidebarLayout {
  const shouldCollapse = collapsed ? pointerWidth < EXPAND_FROM : pointerWidth < COLLAPSE_BELOW
  return shouldCollapse ? { collapsed: true } : { collapsed: false, width: clampWidth(pointerWidth) }
}

/** Keyboard equivalents: Home collapses, End maxes out, arrows step 20px and fold or unfold the list at 260. */
export function resolveKey(collapsed: boolean, width: number, key: string): SidebarLayout | null {
  const current = collapsed ? 0 : width
  switch (key) {
    case 'Home':
      return { collapsed: true }
    case 'End':
      return { collapsed: false, width: SIDEBAR_MAX }
    case 'ArrowRight':
      return { collapsed: false, width: current < SIDEBAR_MIN ? SIDEBAR_MIN : clampWidth(current + KEY_STEP) }
    case 'ArrowLeft':
      return current <= SIDEBAR_MIN ? { collapsed: true } : { collapsed: false, width: clampWidth(current - KEY_STEP) }
    default:
      return null
  }
}
