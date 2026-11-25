import { spawn } from 'node:child_process'
import { loginShellPath } from './loginShellPath'
import { clip } from './textWindow'

const IS_WINDOWS = process.platform === 'win32'
const ENV_NAMES = ['PATH', 'HOME', 'LANG', 'TMPDIR', 'USER']
// Windows programs fail to start or find their own files without these
const WINDOWS_ENV_NAMES = [
  'SYSTEMROOT',
  'WINDIR',
  'COMSPEC',
  'PATHEXT',
  'USERPROFILE',
  'USERNAME',
  'TEMP',
  'TMP',
  'APPDATA',
  'LOCALAPPDATA',
  'PROGRAMDATA',
]

/** Runs a shell command in `cwd` and returns what it printed, stdout and stderr interleaved as a terminal shows them; a non-zero exit or running past `timeoutMs` throws. */
export async function runCommand(
  command: string,
  cwd: string,
  maxChars: number,
  timeoutMs: number,
  abortSignal?: AbortSignal,
): Promise<string> {
  const shellPath = await loginShellPath()
  abortSignal?.throwIfAborted()
  const timeout = AbortSignal.timeout(timeoutMs)
  const signal = abortSignal ? AbortSignal.any([abortSignal, timeout]) : timeout
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...commandEnv(), ...(shellPath ? { PATH: shellPath } : {}) },
      detached: !IS_WINDOWS, // makes it a process group leader on POSIX: killing the group reaches what it started
      windowsHide: true,
    })
    const stop = () => {
      killTree(child.pid)
      // a process the command left behind can hold the output open, and 'close' waits for it
      child.stdout.destroy()
      child.stderr.destroy()
    }
    signal.addEventListener('abort', stop, { once: true })
    let output = ''
    const collect = (chunk: string) => {
      if (output.length <= maxChars) output += chunk
    }
    for (const stream of [child.stdout, child.stderr]) stream.setEncoding('utf8').on('data', collect)
    child.on('error', reject)
    child.on('close', (code) => {
      signal.removeEventListener('abort', stop)
      const text =
        output.length > maxChars ? `${clip(output, maxChars)}\n…（输出超过 ${maxChars} 字，后面的没有保留）` : output
      if (code === 0) {
        resolve(text || '（命令执行成功，没有输出）')
        return
      }
      const reason = timeout.aborted
        ? `命令运行超过 ${timeoutMs / 1000} 秒仍未结束，已中止：可能在等输入、等网络，或者它启动的程序没有退出`
        : code === null || signal.aborted
          ? '命令被中止'
          : `命令失败，退出码 ${code}`
      reject(new Error(text ? `${reason}：\n${text}` : reason))
    })
  })
}

/** Only what programs need to run: keys and tokens in the app's environment (GITHUB_TOKEN…) stay out of the command's reach. */
function commandEnv(): Record<string, string> {
  const names = IS_WINDOWS ? [...ENV_NAMES, ...WINDOWS_ENV_NAMES] : ENV_NAMES
  return Object.fromEntries(
    names.flatMap((name) => {
      const value = process.env[name]
      return value === undefined ? [] : [[name, value]]
    }),
  )
}

function killTree(pid: number | undefined) {
  if (pid === undefined) return
  if (IS_WINDOWS) {
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true }).on('error', (error) =>
      console.error('could not stop the command:', error),
    )
    return
  }
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    // the group has already exited
  }
}
