import fs from 'node:fs'
import path from 'node:path'

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
}

/** The renderer for a device's browser: the built files, or in development whatever the Vite dev server serves. */
export function appFiles(devUrl: string | undefined, root: string): (wanted: string) => Promise<Response> {
  // joined as text: resolved as a URL, a path like //evil.example would send the request to another host
  if (devUrl) return (wanted) => fetch(new URL(devUrl).origin + wanted)
  return async (wanted) => {
    const { pathname } = new URL(wanted, 'http://lan')
    const file = path.join(root, pathname === '/' ? 'index.html' : decodeURIComponent(pathname))
    if (!file.startsWith(root + path.sep)) return new Response(null, { status: 404 })
    try {
      const type = CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream'
      return new Response(new Uint8Array(await fs.promises.readFile(file)), { headers: { 'content-type': type } })
    } catch {
      return new Response(null, { status: 404 })
    }
  }
}
