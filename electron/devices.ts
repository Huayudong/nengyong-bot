import { createHash, randomBytes, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { DeviceKind, type DeviceView, type PairingAsk } from '../shared/devices'

const FILE_NAME = 'devices.json'
const TOKEN_BYTES = 32

const StoredDevice = z.object({
  id: z.string(),
  name: z.string(),
  kind: DeviceKind,
  tokenHash: z.string(), // the file never holds a token that works: a copy of it lets nobody in
  createdAt: z.number(),
  lastSeenAt: z.number(),
})
const Stored = z.object({ isLanOn: z.boolean(), devices: z.array(StoredDevice) })
type Stored = z.infer<typeof Stored>

const NOTHING_STORED: Stored = { isLanOn: false, devices: [] }

export type Devices = ReturnType<typeof createDevices>

/** 局域网访问 and the paired devices, saved in `dir`: whether the local network may connect, and whom it lets in. */
export function createDevices(dir: string) {
  const file = path.join(dir, FILE_NAME)
  let stored = load(file)
  const save = (next: Stored) => {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 })
    stored = next
  }

  return {
    isLanOn: () => stored.isLanOn,
    setLanOn: (isLanOn: boolean) => save({ ...stored, isLanOn }),
    views: (onlineIds: ReadonlySet<string>): DeviceView[] =>
      stored.devices.map(({ id, name, kind, lastSeenAt }) => ({
        id,
        name,
        kind,
        lastSeenAt,
        isOnline: onlineIds.has(id),
      })),
    /** Lets a device in; returns the token its cookie carries from now on. */
    add(ask: PairingAsk, at: number): string {
      const token = randomBytes(TOKEN_BYTES).toString('base64url')
      const device = {
        id: randomUUID(),
        name: ask.name,
        kind: ask.kind,
        tokenHash: hashOf(token),
        createdAt: at,
        lastSeenAt: at,
      }
      save({ ...stored, devices: [...stored.devices, device] })
      return token
    },
    remove: (id: string) => save({ ...stored, devices: stored.devices.filter((device) => device.id !== id) }),
    idOf(token: string): string | undefined {
      const hash = hashOf(token)
      return stored.devices.find((device) => device.tokenHash === hash)?.id
    },
    seen: (id: string, at: number) =>
      save({
        ...stored,
        devices: stored.devices.map((device) => (device.id === id ? { ...device, lastSeenAt: at } : device)),
      }),
  }
}

const hashOf = (token: string) => createHash('sha256').update(token).digest('base64url')

function load(file: string): Stored {
  try {
    if (!fs.existsSync(file)) return NOTHING_STORED
    return Stored.parse(JSON.parse(fs.readFileSync(file, 'utf8')))
  } catch (error) {
    // only this app writes the file: a broken one starts closed, with nobody let in, until the user turns it on again
    console.error(`${file} unreadable, starting with LAN access off and no devices:`, error)
    return NOTHING_STORED
  }
}
