import type { PairingAsk } from '../../shared/devices'
import { strings } from '../../shared/strings'

/**
 * What this browser calls itself on the computer's 设备 page. A home screen web app keeps its own cookies apart from
 * the browser's, so it pairs on its own and says so, letting the user tell the two apart.
 */
export function thisDevice(userAgent: string, touchPoints: number, isHomeScreen: boolean): PairingAsk {
  const device = kindOf(userAgent, touchPoints)
  return isHomeScreen ? { ...device, name: strings().remote.device.homeScreen(device.name) } : device
}

function kindOf(userAgent: string, touchPoints: number): PairingAsk {
  if (/iPhone/.test(userAgent)) return { name: 'iPhone', kind: 'phone' }
  // iPadOS asks for the desktop site by default: its browser says Macintosh, but a Mac has no touch screen
  if (/iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1))
    return { name: 'iPad', kind: 'tablet' }
  if (/Android/.test(userAgent))
    return /Mobile/.test(userAgent)
      ? { name: strings().remote.device.androidPhone, kind: 'phone' }
      : { name: strings().remote.device.androidTablet, kind: 'tablet' }
  if (/Macintosh/.test(userAgent)) return { name: 'Mac', kind: 'computer' }
  if (/Windows/.test(userAgent)) return { name: strings().remote.device.windowsPc, kind: 'computer' }
  return { name: strings().remote.device.browser, kind: 'computer' }
}
