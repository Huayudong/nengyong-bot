import fs from 'node:fs'
import path from 'node:path'

export const LOCK_FILE = 'nengyongbot.lock'

/**
 * Takes the home for this process, or null when another running copy holds it.
 *
 * A copy with its own Electron profile (the dev one) passes Electron's single-instance lock, but both would open the
 * same database: the copy that starts second marks the first one's running tasks interrupted, and their results are
 * dropped when they finish. A lock left behind by a copy that is gone is moved aside with a rename, which is atomic:
 * two copies starting at the same time cannot both take it.
 */
export function lockHome(home: string): (() => void) | null {
  fs.mkdirSync(home, { recursive: true })
  const file = path.join(home, LOCK_FILE)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      fs.writeFileSync(file, String(process.pid), { flag: 'wx' })
      return () => fs.rmSync(file, { force: true })
    } catch (error) {
      if (!fs.existsSync(file)) throw error
    }
    if (isHeldByRunningCopy(file)) return null
    const stale = `${file}.stale-${process.pid}`
    try {
      fs.renameSync(file, stale)
    } catch {
      continue // another starting copy moved it, or took the lock itself
    }
    fs.rmSync(stale, { force: true })
  }
  return null
}

function isHeldByRunningCopy(file: string): boolean {
  let text = ''
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    return false
  }
  const holder = Number(text)
  if (!Number.isInteger(holder) || holder <= 0) return false
  try {
    process.kill(holder, 0)
    return true
  } catch (error) {
    // EPERM: the process is there, this one may just not signal it
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'EPERM'
  }
}
