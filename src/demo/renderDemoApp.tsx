import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SidebarState } from '../../shared/sidebar'
import { App } from '../App'
import { createDemoBridge } from './demoBridge'
import { DEMO_SIDEBAR } from './demoData'

/** For interface tests: the whole app on the demo bridge, as `npm run dev` shows it in a browser. */
export function renderDemoApp(bridge = createDemoBridge(), initialSidebar: SidebarState = DEMO_SIDEBAR) {
  return { bridge, user: userEvent.setup(), ...render(<App bridge={bridge} initialSidebar={initialSidebar} />) }
}
