import { autoUpdater } from 'electron-updater'
import type { HarnessEvent, UpdateCheck } from '../shared/bridge'
import { strings } from '../shared/strings'

/** 检查更新: what GitHub Releases has, and installing it once the user asks. Nothing downloads before that. */
export function createUpdates(emit: (event: HarnessEvent) => void) {
  autoUpdater.autoDownload = false
  autoUpdater.on('download-progress', ({ percent, transferred, total }) =>
    emit({ kind: 'update-progress', percent, transferredBytes: transferred, totalBytes: total }),
  )
  // installing can still fail once the download is in: Squirrel.Mac checks the new app's signature, NSIS may not start
  autoUpdater.on('error', (error) =>
    emit({ kind: 'update-error', message: reasonOf(error, strings().main.update.cannotInstall) }),
  )
  return {
    async checkForUpdate(): Promise<UpdateCheck> {
      const result = await autoUpdater.checkForUpdates().catch(() => {
        throw new Error(strings().main.update.cannotCheck)
      })
      // null: a development build, or a Linux one not run as an AppImage, which electron-updater cannot replace
      if (!result) throw new Error(strings().main.update.cannotInstallHere)
      return {
        version: result.updateInfo.version,
        date: result.updateInfo.releaseDate,
        isNewer: result.isUpdateAvailable,
      }
    },
    async installUpdate() {
      await autoUpdater.downloadUpdate().catch((error: unknown) => {
        throw new Error(reasonOf(error, strings().main.update.cannotDownload))
      })
      // after the reply goes out, so the window hears the download finished; silent: no installer window on Windows
      setImmediate(() => autoUpdater.quitAndInstall(true, true))
    },
  }
}

// Squirrel.Mac refuses an app run from its disk image or translocated from Downloads: moving it is what helps, not retrying
function reasonOf(error: unknown, otherwise: string) {
  return /read-only volume/i.test(String(error)) ? strings().main.update.moveToApplications : otherwise
}
