// Dev loop: build main/preload once, start the Vite dev server (HMR for the UI), then launch Electron against it.
// Changes under electron/ or harness/ need a restart of this script.
import { spawn } from 'node:child_process'
import { build, createServer } from 'vite'
import electron from 'electron'

// localStorage belongs to the page's origin: a port that drifts when 5173 is taken would start the UI from scratch
const PORT = 5199
const RESTART_CODE = 75 // the app exits with this to be started again (after moving or importing its data)

await build({ configFile: 'vite.electron.config.ts', logLevel: 'warn' })
const server = await createServer({ server: { port: PORT, strictPort: true } })
await server.listen()
const url = server.resolvedUrls?.local[0]
if (!url) throw new Error('Vite dev server did not report a local URL')

function launch() {
  const env = { ...process.env, VITE_DEV_SERVER_URL: url, NENGYONGBOT_DEV_RESTART_CODE: String(RESTART_CODE) }
  const child = spawn(electron, ['.'], { stdio: 'inherit', env })
  child.on('exit', async (code) => {
    if (code === RESTART_CODE) return launch()
    await server.close()
    process.exit(code ?? 0)
  })
}
launch()
