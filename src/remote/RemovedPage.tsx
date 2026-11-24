import { Icon } from '../ui/Icon'
import { strings } from '../../shared/strings'

/** What a device removed on the computer shows: starting over asks to pair again. */
export function RemovedPage() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-3 px-9 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-muted text-white">
        <Icon name="phone" size={28} />
      </span>
      <h1 className="text-xl font-semibold">{strings().remote.removed}</h1>
      <p className="text-md text-soft">{strings().remote.removedHint}</p>
      <button onClick={() => location.reload()} className="mt-4 h-11 rounded-full bg-ink px-6 text-md text-canvas">
        {strings().remote.reconnect}
      </button>
    </main>
  )
}
