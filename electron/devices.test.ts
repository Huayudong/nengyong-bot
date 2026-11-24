// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, expect, it, vi } from 'vitest'
import { createDevices } from './devices'

let dir: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devices-'))
})

const IPHONE = { name: 'iPhone', kind: 'phone' } as const

it('starts with 局域网访问 off and nobody let in', () => {
  const devices = createDevices(dir)
  expect(devices.isLanOn()).toBe(false)
  expect(devices.views(new Set())).toEqual([])
})

it('knows a device again by the token it was given', () => {
  const devices = createDevices(dir)
  const token = devices.add(IPHONE, 1000)
  const [device] = devices.views(new Set())
  expect(devices.idOf(token)).toBe(device.id)
  expect(devices.idOf('made-up-token')).toBeUndefined()
})

it('keeps no working token on disk', () => {
  const token = createDevices(dir).add(IPHONE, 1000)
  expect(fs.readFileSync(path.join(dir, 'devices.json'), 'utf8')).not.toContain(token)
})

it('remembers the switch and the devices across restarts', () => {
  const devices = createDevices(dir)
  devices.setLanOn(true)
  const token = devices.add(IPHONE, 1000)
  const reopened = createDevices(dir)
  expect(reopened.isLanOn()).toBe(true)
  expect(reopened.idOf(token)).toBeDefined()
})

it('turns a removed device away', () => {
  const devices = createDevices(dir)
  const token = devices.add(IPHONE, 1000)
  const [device] = devices.views(new Set())
  devices.remove(device.id)
  expect(devices.idOf(token)).toBeUndefined()
})

it('marks the devices with an open connection as online and records when each was last seen', () => {
  const devices = createDevices(dir)
  devices.add(IPHONE, 1000)
  const [device] = devices.views(new Set())
  devices.seen(device.id, 5000)
  expect(devices.views(new Set([device.id]))).toEqual([{ ...device, isOnline: true, lastSeenAt: 5000 }])
})

it('starts closed when the file is broken', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  fs.writeFileSync(path.join(dir, 'devices.json'), '{ broken')
  expect(createDevices(dir).isLanOn()).toBe(false)
})
