import net from 'node:net'
import os from 'node:os'

/** This computer's IPv4 addresses, home and office networks first: the first one is what a device is shown. */
export function lanAddresses(): string[] {
  // a VPN's tunnel (Clash, WireGuard, Tailscale) has no hardware address, and its address can be private while the Wi-Fi's is not
  const isTunnel = (entry: os.NetworkInterfaceInfo) => entry.mac === '00:00:00:00:00:00'
  const isPrivate = (entry: os.NetworkInterfaceInfo) =>
    /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address)
  const rank = (entry: os.NetworkInterfaceInfo) => (isTunnel(entry) ? 2 : 0) + (isPrivate(entry) ? 0 : 1)
  return ipv4Interfaces()
    .toSorted((a, b) => rank(a) - rank(b))
    .map((entry) => entry.address)
}

/** Loopback, the private ranges, link-local and the networks this computer is on, in IPv4, in IPv6, and IPv4 written as IPv6. */
export function isLocalAddress(address: string) {
  const ip = address.replace(/^::ffff:/i, '')
  if (ip === '::1' || /^f[cd]/i.test(ip) || /^fe[89ab]/i.test(ip)) return true
  if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) return true
  // some networks give their Wi-Fi public addresses, so a phone on the same Wi-Fi has one too
  return (
    net.isIPv4(ip) &&
    ipv4Interfaces().some(
      ({ address: own, netmask }) => (bitsOf(ip) & bitsOf(netmask)) === (bitsOf(own) & bitsOf(netmask)),
    )
  )
}

function ipv4Interfaces() {
  return Object.values(os.networkInterfaces()).flatMap((entries) =>
    (entries ?? []).filter((entry) => entry.family === 'IPv4' && !entry.internal),
  )
}

function bitsOf(ip: string) {
  return ip.split('.').reduce((bits, part) => (bits << 8) | Number(part), 0)
}
