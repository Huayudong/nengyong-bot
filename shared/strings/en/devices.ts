import { plural } from '../../language'
import type { Strings } from '../../strings'

export const devices: Strings['devices'] = {
  settings: {
    title: 'Devices',
    intro:
      'This computer is the host: chats, keys and the library stay here. Phones and tablets that connect use the bots on this computer.',
    lanAccess: 'LAN access',
    lanAccessHint: 'When on, phones and tablets on the same Wi-Fi can connect',
    connected: (count) => `Connected devices · ${count}`,
    reconnectNote:
      'Devices disconnect while this computer sleeps or is off; once it wakes up on the same Wi-Fi, they reconnect on their own.',
    turnOffTitle: 'Turn off LAN access?',
    turnOffBody: (online) =>
      `${plural(online, 'connected device')} will disconnect at once. When you turn it back on, they reconnect on their own, no need to scan again.`,
    turnOff: 'Turn off',
    removeTitle: (name) => `Remove "${name}"?`,
    removeBody: 'It disconnects at once. To use it again, scan the code to connect it again.',
    remove: 'Remove',
    removeDevice: (name) => `Remove ${name}`,
    online: 'Online',
    offline: 'Offline',
    disconnected: 'Disconnected',
    lastSeen: (state, time) => `${state} · last seen ${time}`,
    connectNew: 'Connect a new device',
    noNetwork: 'This computer is not on a local network. Connect to Wi-Fi and try again',
    qrLabel: (address) => `QR code for the address ${address}`,
    scan: "Scan with your phone's camera",
    orOpen: "Or open it in your phone's browser",
    copy: 'Copy',
    codeHint:
      'The phone then shows a 4-digit pairing code. Type it into the box that pops up here, and it is connected.',
    warning:
      'A connected device can use every bot on this computer, including having them run commands on it. Connect only your own devices.',
  },
  pairing: {
    title: (name) => `Let "${name}" connect?`,
    body: 'Type the 4-digit pairing code on its screen. Once connected, it can see every chat and put the bots to work.',
    code: 'Pairing code',
    deny: 'Deny',
    allow: 'Allow',
  },
}
