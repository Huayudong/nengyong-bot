const REVOKE_AFTER_MS = 10_000

/** Hands a file to the download the platform runs: Electron asks where to save it. */
export function saveFile(blob: Blob, name: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = name
  link.click()
  // revoked at once, the URL can be gone before the download has read it
  window.setTimeout(() => URL.revokeObjectURL(link.href), REVOKE_AFTER_MS)
}
