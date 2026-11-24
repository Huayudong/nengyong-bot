import type { Strings } from '../../strings'

export const remote: Strings['remote'] = {
  unreachable: "Can't reach the computer",
  bannerHint:
    "The computer may be asleep or have LAN access off, or you're not on the same Wi-Fi. This page refreshes once it's back.",
  pairing: {
    declined: 'The computer turned down the connection',
    declinedHint: 'If it was you, go back to the computer and try again',
    expired: 'The connection request expired',
    expiredHint: 'Nobody entered the pairing code on the computer within two minutes, or another device sent a request',
    lost: 'Lost the connection to the computer',
    lostHint: 'Make sure the phone and the computer are on the same Wi-Fi, then try again',
    connecting: 'Connecting to the computer…',
    title: 'Connect to Nengyong Bot on your computer',
    enterCode: 'Enter this pairing code in the box that pops up on the computer',
    code: (code) => `Pairing code ${code}`,
    waiting: 'Waiting for the computer to allow it…',
    connected: 'Connected, opening…',
  },
  reconnect: 'Connect again',
  removed: 'This device was removed',
  removedHint: 'To keep using it, connect again and click Allow on the computer',
  newReply: (name, text) => `New message from ${name}: ${text}`,
  unreachableWifi: "Can't reach the computer. Make sure the phone and the computer are on the same Wi-Fi",
  desktopOnly: 'This can only be done on the computer',
  noResponse: (status) => `The computer did not respond (${status})`,
  device: {
    homeScreen: (name) => `${name} (Home Screen)`,
    androidPhone: 'Android phone',
    androidTablet: 'Android tablet',
    windowsPc: 'Windows PC',
    browser: 'Browser',
  },
  back: 'Back',
  panelTitle: (name) => `${name}'s panel`,
}
