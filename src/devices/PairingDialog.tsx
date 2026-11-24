import { useState } from 'react'
import type { NengyongBotBridge } from '../../shared/bridge'
import { PairingCode, type PairingRequest } from '../../shared/devices'
import { strings } from '../../shared/strings'
import { ipcErrorMessage } from '../ipcErrorMessage'
import { Dialog } from '../ui/Dialog'

interface Props {
  request: PairingRequest
  bridge: Pick<NengyongBotBridge, 'answerPairing'>
}

/**
 * A device on the local network asks to be let in. The user types the code its screen shows: only the device that asked
 * shows it, so another one asking at the same moment cannot be let in by mistake. Closes once answered or expired.
 */
export function PairingDialog({ request, bridge }: Props) {
  const [code, setCode] = useState('')
  const [failure, setFailure] = useState<string | null>(null)
  const isComplete = PairingCode.safeParse(code).success
  const answer = (typed: string | null) =>
    bridge.answerPairing(request.id, typed).catch((error) => setFailure(ipcErrorMessage(error)))

  return (
    <Dialog labelledBy="pairing-title" onClose={() => answer(null)} className="w-[380px] rounded-2xl bg-surface p-6">
      <h2 id="pairing-title" className="text-lg font-semibold">
        {strings().devices.pairing.title(request.name)}
      </h2>
      <p className="mt-2 text-sm text-soft">{strings().devices.pairing.body}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (isComplete) answer(code)
        }}
      >
        <input
          autoFocus
          aria-label={strings().devices.pairing.code}
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, ''))
            setFailure(null)
          }}
          className="mt-4 h-14 w-full rounded-lg bg-bubble text-center font-mono text-2xl font-semibold tracking-[0.5em] outline-none focus:ring-1 focus:ring-accent"
        />
        {failure && <p className="mt-2 text-sm text-danger">{failure}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => answer(null)} className="h-9 rounded-full bg-bubble px-4 text-md">
            {strings().devices.pairing.deny}
          </button>
          <button
            type="submit"
            disabled={!isComplete}
            className="h-9 rounded-full bg-ink px-4 text-md text-canvas disabled:opacity-40"
          >
            {strings().devices.pairing.allow}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
