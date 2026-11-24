// @vitest-environment node
import os from 'node:os'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { isLocalAddress, lanAddresses } from './lanAddresses'

// the Windows computer from a user's report: a WireGuard tunnel on 10.7.0.2, the Wi-Fi on a public range
beforeEach(() => {
  vi.spyOn(os, 'networkInterfaces').mockReturnValue({
    本地连接: [ipv4('10.7.0.2', '00:00:00:00:00:00')],
    WLAN: [ipv4('88.185.192.11', 'e8:4c:4a:12:34:56')],
  })
})
afterEach(() => vi.restoreAllMocks())

it('shows the Wi-Fi address before a VPN tunnel that holds a private one', () => {
  expect(lanAddresses()).toEqual(['88.185.192.11', '10.7.0.2'])
})

it('lets in this computer and the local networks', () => {
  for (const ip of ['127.0.0.1', '::1', '192.168.31.20', '10.0.0.8', '172.20.1.2', '169.254.3.4', 'fe80::1', 'fd12::3'])
    expect(isLocalAddress(ip), ip).toBe(true)
})

it('lets in a local IPv4 address written as IPv6', () => {
  expect(isLocalAddress('::ffff:192.168.1.5')).toBe(true)
})

it('lets in a phone on the same Wi-Fi when the Wi-Fi hands out public addresses', () => {
  expect(isLocalAddress('::ffff:88.185.195.40')).toBe(true)
})

it('keeps the internet out, over IPv4 and IPv6', () => {
  for (const ip of ['8.8.8.8', '88.185.196.1', '172.32.0.1', '100.64.0.1', '2408:8207:1234::1', '::ffff:1.2.3.4', ''])
    expect(isLocalAddress(ip), ip).toBe(false)
})

function ipv4(address: string, mac: string): os.NetworkInterfaceInfo {
  return { address, mac, netmask: '255.255.252.0', family: 'IPv4', internal: false, cidr: `${address}/22` }
}
