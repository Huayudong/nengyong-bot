import type { HarnessEvent, UpdateCheck } from '../../shared/bridge'

/** 检查更新 as the window shows it: the popup in the corner and the row on the 更新记录 page both read it. */
export type UpdateState =
  | { kind: 'idle' }
  | { kind: 'updated'; version: string } // the first run of a new version: the popup says so once
  | { kind: 'checking' }
  | { kind: 'latest'; check: UpdateCheck } // the user's check found nothing newer; a quiet one leaves the state as it was
  | { kind: 'checkFailed'; message: string } // likewise only after the user's check
  | { kind: 'available'; check: UpdateCheck; isPopupOpen: boolean }
  | { kind: 'downloading'; check: UpdateCheck; percent: number; transferredBytes: number; totalBytes: number }
  | { kind: 'restarting'; check: UpdateCheck }
  | { kind: 'installFailed'; check: UpdateCheck; message: string }

type UpdateEvent =
  | { kind: 'checking' }
  | { kind: 'checked'; check: UpdateCheck; isQuiet: boolean } // isQuiet: the check after launch, which speaks up only when it finds one
  | { kind: 'check-failed'; message: string; isQuiet: boolean }
  | { kind: 'installing' }
  | Extract<HarnessEvent, { kind: 'update-progress' }>
  | { kind: 'installed' }
  | { kind: 'install-failed'; message: string } // the download did not finish
  | { kind: 'restart-failed'; message: string } // the download did, but installing it did not start
  | { kind: 'close-popup' }

export type Popup = Extract<
  UpdateState,
  { kind: 'updated' | 'available' | 'downloading' | 'restarting' | 'installFailed' }
>

const IDLE: UpdateState = { kind: 'idle' }

/** lastVersion: what ran the time before, null on the first run ever, which is no update. */
export function initialUpdate(lastVersion: string | null, version: string): UpdateState {
  return lastVersion !== null && lastVersion !== version ? { kind: 'updated', version } : IDLE
}

export function updateState(state: UpdateState, event: UpdateEvent): UpdateState {
  switch (event.kind) {
    case 'checking':
    case 'checked':
    case 'check-failed':
      return state.kind === 'downloading' || state.kind === 'restarting' ? state : checkedState(state, event)
    case 'installing':
      if (state.kind !== 'available' && state.kind !== 'installFailed') return state
      return { kind: 'downloading', check: state.check, percent: 0, transferredBytes: 0, totalBytes: 0 }
    case 'update-progress':
      if (state.kind !== 'downloading') return state
      return {
        ...state,
        percent: event.percent,
        transferredBytes: event.transferredBytes,
        totalBytes: event.totalBytes,
      }
    case 'installed':
      return state.kind === 'downloading' ? { kind: 'restarting', check: state.check } : state
    case 'install-failed':
      return state.kind === 'downloading'
        ? { kind: 'installFailed', check: state.check, message: event.message }
        : state
    case 'restart-failed':
      return state.kind === 'restarting' ? { kind: 'installFailed', check: state.check, message: event.message } : state
    case 'close-popup':
      if (state.kind === 'updated') return IDLE
      if (state.kind !== 'available' && state.kind !== 'installFailed') return state
      return { kind: 'available', check: state.check, isPopupOpen: false }
    default:
      return event satisfies never
  }
}

function checkedState(
  state: UpdateState,
  event: Extract<UpdateEvent, { kind: 'checking' | 'checked' | 'check-failed' }>,
): UpdateState {
  switch (event.kind) {
    case 'checking':
      return { kind: 'checking' }
    case 'checked':
      if (event.check.isNewer) return { kind: 'available', check: event.check, isPopupOpen: event.isQuiet }
      return event.isQuiet ? state : { kind: 'latest', check: event.check }
    case 'check-failed':
      return event.isQuiet ? state : { kind: 'checkFailed', message: event.message }
    default:
      return event satisfies never
  }
}

/** What the popup in the corner shows; null while it is closed. A download shows there wherever it was started. */
export function popupOf(state: UpdateState): Popup | null {
  switch (state.kind) {
    case 'available':
      return state.isPopupOpen ? state : null
    case 'updated':
    case 'downloading':
    case 'restarting':
    case 'installFailed':
      return state
    case 'idle':
    case 'checking':
    case 'latest':
    case 'checkFailed':
      return null
    default:
      return state satisfies never
  }
}
