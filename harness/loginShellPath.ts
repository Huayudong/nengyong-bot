import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const SHELL_TIMEOUT_MS = 10_000
const MARKER = '__NENGYONGBOT_PATH__'
let cached: Promise<string | undefined> | null = null

/** The PATH of the user's login shell, read once; undefined on Windows or when the shell cannot be read. */
export function loginShellPath(): Promise<string | undefined> {
  cached ??= readLoginShellPath()
  return cached
}

// an app opened from Finder or the Dock gets launchd's bare PATH, without Homebrew or nvm, so npx and node are missing
async function readLoginShellPath(): Promise<string | undefined> {
  if (process.platform === 'win32') return undefined
  try {
    const { stdout } = await promisify(execFile)(
      process.env.SHELL || '/bin/sh',
      ['-ilc', `printf '${MARKER}%s${MARKER}' "$PATH"`],
      { timeout: SHELL_TIMEOUT_MS },
    )
    return stdout.split(MARKER)[1] || undefined
  } catch (error) {
    console.error('could not read PATH from the login shell:', error)
    return undefined
  }
}
