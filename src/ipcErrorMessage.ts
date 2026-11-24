// Electron prefixes IPC errors with "Error invoking remote method …"; keep only our message
export const ipcErrorMessage = (error: unknown) =>
  String(error instanceof Error ? error.message : error).replace(/^.*Error: /s, '')
