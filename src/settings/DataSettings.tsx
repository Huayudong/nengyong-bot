import { useEffect, useState } from 'react'
import type { NengyongBotBridge } from '../../shared/bridge'
import { ipcErrorMessage } from '../ipcErrorMessage'
import { SettingsButton, SettingsRow, SettingsSection } from './SettingsSection'
import { strings } from '../../shared/strings'

interface Props {
  bridge: Pick<NengyongBotBridge, 'getDataDir' | 'openDataDir' | 'moveDataDir' | 'exportData' | 'importData'>
}

type Status = { kind: 'idle' | 'busy' } | { kind: 'done' | 'error'; message: string }

/** Where the data lives, and exporting or importing it. The folders are picked in native dialogs. */
export function DataSettings({ bridge }: Props) {
  const words = strings().settings.data
  const [dataDir, setDataDir] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    bridge.getDataDir().then(setDataDir, (error) => setStatus({ kind: 'error', message: ipcErrorMessage(error) }))
  }, [bridge])

  // importing or moving restarts the app when it goes through, so only a cancel or a failure comes back here
  const run = async (action: () => Promise<string | null>) => {
    setStatus({ kind: 'busy' })
    try {
      const exported = await action()
      setStatus(exported ? { kind: 'done', message: words.exported(exported) } : { kind: 'idle' })
    } catch (error) {
      setStatus({ kind: 'error', message: ipcErrorMessage(error) })
    }
  }
  const busy = status.kind === 'busy'

  return (
    <div className="min-w-0 flex-1 overflow-y-auto px-10 pt-9 pb-8">
      <h2 id="settings-title" className="text-xl font-semibold tracking-tight">
        {words.title}
      </h2>
      <p className="mt-1 text-sm text-muted">{words.intro}</p>

      <SettingsSection title={words.location}>
        <SettingsRow label={words.dataDir} hint={<span className="break-all font-mono">{dataDir}</span>}>
          <div className="flex shrink-0 gap-2">
            <SettingsButton
              onClick={() =>
                run(async () => {
                  await bridge.openDataDir()
                  return null
                })
              }
              disabled={busy}
            >
              {words.open}
            </SettingsButton>
            <SettingsButton
              onClick={() =>
                run(async () => {
                  await bridge.moveDataDir()
                  return null
                })
              }
              disabled={busy}
            >
              {words.change}
            </SettingsButton>
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={words.backup}>
        <SettingsRow label={words.export} hint={words.exportHint}>
          <SettingsButton onClick={() => run(bridge.exportData)} disabled={busy}>
            {words.exportButton}
          </SettingsButton>
        </SettingsRow>
        <SettingsRow label={words.import} hint={words.importHint}>
          <SettingsButton
            onClick={() =>
              run(async () => {
                await bridge.importData()
                return null
              })
            }
            disabled={busy}
          >
            {words.importButton}
          </SettingsButton>
        </SettingsRow>
      </SettingsSection>

      <p
        role="status"
        data-status={status.kind}
        className="mt-4 px-1 text-sm text-muted data-[status=error]:text-danger"
      >
        {status.kind === 'done' || status.kind === 'error' ? status.message : ''}
      </p>
    </div>
  )
}
