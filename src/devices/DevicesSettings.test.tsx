import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import type { DevicesView } from '../../shared/devices'
import { DevicesSettings } from './DevicesSettings'

const ADDRESS = 'http://192.168.1.23:4317'
const OFF: DevicesView = { isLanOn: false, address: null, error: null, devices: [] }
const ON: DevicesView = { isLanOn: true, address: ADDRESS, error: null, devices: [] }
const IPHONE = { id: 'iphone', name: 'iPhone', kind: 'phone', isOnline: true, lastSeenAt: 0 } as const
const WITH_IPHONE: DevicesView = { ...ON, devices: [IPHONE] }

afterEach(cleanup)

function bridgeWith(view: DevicesView) {
  return {
    getDevices: vi.fn(async () => view),
    setLanAccess: vi.fn(async (isOn: boolean) => (isOn ? ON : OFF)),
    removeDevice: vi.fn(async () => ON),
  }
}

// the page suspends until the devices are read; outside act, the test environment never lets it resume
async function renderPage(bridge: ReturnType<typeof bridgeWith>, live: DevicesView | null = null) {
  await act(async () => {
    render(<DevicesSettings bridge={bridge} live={live} />)
  })
}

it('turns 局域网访问 on from its switch', async () => {
  const bridge = bridgeWith(OFF)
  await renderPage(bridge)
  await userEvent.click(screen.getByRole('switch', { name: '局域网访问' }))
  expect(bridge.setLanAccess).toHaveBeenCalledWith(true)
})

it('shows the code to scan and the address to type while it is on', async () => {
  await renderPage(bridgeWith(ON))
  expect(screen.getByRole('img', { name: `连接地址 ${ADDRESS} 的二维码` })).toBeInTheDocument()
  expect(screen.getByText(ADDRESS)).toBeInTheDocument()
})

it('shows no code while it is off', async () => {
  await renderPage(bridgeWith(OFF))
  expect(screen.queryByRole('img', { name: /二维码/ })).not.toBeInTheDocument()
})

it('says why it does not listen instead of showing a code', async () => {
  await renderPage(bridgeWith({ ...ON, address: null, error: '端口 4317 被别的程序占用了' }))
  expect(screen.getByText('端口 4317 被别的程序占用了')).toBeInTheDocument()
  expect(screen.queryByRole('img', { name: /二维码/ })).not.toBeInTheDocument()
})

it('follows what the harness reports while the page is open', async () => {
  await renderPage(bridgeWith(ON), WITH_IPHONE)
  expect(screen.getByText('iPhone')).toBeInTheDocument()
  expect(screen.getByText('在线')).toBeInTheDocument()
})

it('asks before turning it off while a device is connected', async () => {
  const bridge = bridgeWith(WITH_IPHONE)
  await renderPage(bridge)
  await userEvent.click(screen.getByRole('switch', { name: '局域网访问' }))
  expect(bridge.setLanAccess).not.toHaveBeenCalled()
  const dialog = screen.getByRole('dialog', { name: '关闭局域网访问？' })
  await userEvent.click(within(dialog).getByRole('button', { name: '关闭' }))
  expect(bridge.setLanAccess).toHaveBeenCalledWith(false)
})

it('asks before removing a device, then removes it', async () => {
  const bridge = bridgeWith(WITH_IPHONE)
  await renderPage(bridge)
  await userEvent.click(screen.getByRole('button', { name: '移除 iPhone' }))
  const dialog = screen.getByRole('dialog', { name: '移除「iPhone」？' })
  await userEvent.click(within(dialog).getByRole('button', { name: '移除' }))
  expect(bridge.removeDevice).toHaveBeenCalledWith('iphone')
})

it('says when a change fails', async () => {
  const bridge = { ...bridgeWith(OFF), setLanAccess: vi.fn(async () => Promise.reject(new Error('开不了'))) }
  await renderPage(bridge)
  await userEvent.click(screen.getByRole('switch', { name: '局域网访问' }))
  expect(await screen.findByText('开不了')).toBeInTheDocument()
})
