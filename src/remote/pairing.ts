import { PairingAnswer, PairingStarted, REMOTE_API } from '../../shared/devices'
import { reasonOf } from './remoteBridge'
import { thisDevice } from './thisDevice'
import { strings } from '../../shared/strings'

/** Where asking the computer to let this browser in stands. */
export type Pairing = { kind: 'asking'; code: string; answer: Promise<Answer> } | { kind: 'failed'; message: string }

export type Answer = 'allowed' | 'denied' | 'gone' | 'lost'

/** Asks the computer to let this browser in; once it does, the page starts over as a paired device. */
export async function startPairing(): Promise<Pairing> {
  const device = thisDevice(
    navigator.userAgent,
    navigator.maxTouchPoints,
    matchMedia('(display-mode: standalone)').matches,
  )
  const response = await fetch(REMOTE_API.pair, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(device),
  }).catch(() => null)
  if (!response)
    return {
      kind: 'failed',
      message: strings().remote.unreachableWifi,
    }
  if (!response.ok) return { kind: 'failed', message: await reasonOf(response) }
  const { id, code } = PairingStarted.parse(await response.json())
  return { kind: 'asking', code, answer: answerTo(id) }
}

// each request waits on the computer for a while and comes back with `waiting` if nothing was decided yet
async function answerTo(id: string): Promise<Answer> {
  for (;;) {
    const response = await fetch(`${REMOTE_API.pair}/${encodeURIComponent(id)}`).catch(() => null)
    if (!response?.ok) return 'lost'
    const { status } = PairingAnswer.parse(await response.json())
    if (status === 'waiting') continue
    // the cookie came with this answer: the page starts over as a paired device
    if (status === 'allowed') location.reload()
    return status
  }
}
