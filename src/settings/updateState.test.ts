import { describe, expect, it } from 'vitest'
import { initialUpdate, popupOf, type UpdateState, updateState } from './updateState'

const NEWER = { version: '1.2.0', date: '2026-12-01T00:00:00.000Z', isNewer: true }
const SAME = { version: '1.1.0', date: '2026-11-23T00:00:00.000Z', isNewer: false }
const IDLE: UpdateState = { kind: 'idle' }
const AVAILABLE: UpdateState = { kind: 'available', check: NEWER, isPopupOpen: true }
const DOWNLOADING = updateState(AVAILABLE, { kind: 'installing' })

describe('initialUpdate', () => {
  it('says nothing on the first run ever', () => {
    expect(initialUpdate(null, '1.1.0')).toEqual(IDLE)
  })

  it('says nothing when the same version runs again', () => {
    expect(initialUpdate('1.1.0', '1.1.0')).toEqual(IDLE)
  })

  it('announces the first run of a new version', () => {
    expect(initialUpdate('1.0.0', '1.1.0')).toEqual({ kind: 'updated', version: '1.1.0' })
  })
})

describe('updateState', () => {
  it('opens the popup when the check after launch finds a newer version', () => {
    expect(popupOf(updateState(IDLE, { kind: 'checked', check: NEWER, isQuiet: true }))).not.toBeNull()
  })

  it('leaves everything as it was when the check after launch finds nothing or fails', () => {
    const updated: UpdateState = { kind: 'updated', version: '1.1.0' }
    expect(updateState(updated, { kind: 'checked', check: SAME, isQuiet: true })).toBe(updated)
    expect(updateState(updated, { kind: 'check-failed', message: 'offline', isQuiet: true })).toBe(updated)
  })

  it('answers the user’s check where they asked, without the popup', () => {
    expect(updateState(IDLE, { kind: 'checked', check: SAME, isQuiet: false })).toEqual({ kind: 'latest', check: SAME })
    expect(updateState(IDLE, { kind: 'check-failed', message: 'offline', isQuiet: false })).toEqual({
      kind: 'checkFailed',
      message: 'offline',
    })
    expect(popupOf(updateState(IDLE, { kind: 'checked', check: NEWER, isQuiet: false }))).toBeNull()
  })

  it('shows the download in the popup wherever it was started', () => {
    const started = updateState({ ...AVAILABLE, isPopupOpen: false }, { kind: 'installing' })
    expect(popupOf(started)).toMatchObject({ kind: 'downloading', percent: 0 })
  })

  it('follows the download and restarts once it is done', () => {
    const halfway = updateState(DOWNLOADING, {
      kind: 'update-progress',
      percent: 50,
      transferredBytes: 5,
      totalBytes: 10,
    })
    expect(halfway).toMatchObject({ kind: 'downloading', percent: 50, transferredBytes: 5, totalBytes: 10 })
    expect(updateState(halfway, { kind: 'installed' })).toEqual({ kind: 'restarting', check: NEWER })
  })

  it('ignores progress when nothing is downloading', () => {
    const progress = { kind: 'update-progress', percent: 50, transferredBytes: 5, totalBytes: 10 } as const
    expect(updateState(AVAILABLE, progress)).toBe(AVAILABLE)
  })

  it('lets a failed download be tried again or put off', () => {
    const failed = updateState(DOWNLOADING, { kind: 'install-failed', message: 'offline' })
    expect(updateState(failed, { kind: 'installing' })).toMatchObject({ kind: 'downloading' })
    expect(updateState(failed, { kind: 'close-popup' })).toEqual({
      kind: 'available',
      check: NEWER,
      isPopupOpen: false,
    })
  })

  it('says so when installing fails after the download, where nothing else would', () => {
    const restarting = updateState(DOWNLOADING, { kind: 'installed' })
    expect(updateState(restarting, { kind: 'restart-failed', message: 'unsigned' })).toEqual({
      kind: 'installFailed',
      check: NEWER,
      message: 'unsigned',
    })
    expect(updateState(DOWNLOADING, { kind: 'restart-failed', message: 'unsigned' })).toBe(DOWNLOADING)
  })

  it('keeps a running download in sight whatever a check finds meanwhile', () => {
    expect(updateState(DOWNLOADING, { kind: 'checking' })).toBe(DOWNLOADING)
    expect(updateState(DOWNLOADING, { kind: 'checked', check: NEWER, isQuiet: true })).toBe(DOWNLOADING)
  })

  it('keeps a postponed update without the popup', () => {
    const later = updateState(AVAILABLE, { kind: 'close-popup' })
    expect(later).toEqual({ ...AVAILABLE, isPopupOpen: false })
    expect(popupOf(later)).toBeNull()
  })

  it('closes the announcement of a new version for good', () => {
    expect(updateState({ kind: 'updated', version: '1.1.0' }, { kind: 'close-popup' })).toEqual(IDLE)
  })
})
