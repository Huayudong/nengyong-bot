import path from 'node:path'
import { z } from 'zod'
import type { LibraryItem } from '../shared/bridge'
import { strings } from '../shared/strings'
import type { Store } from './store'
import type { Workspace } from './workspace'

const KIND_BY_EXTENSION: Record<string, LibraryItem['kind']> = {
  '.md': 'doc',
  '.markdown': 'doc',
  '.txt': 'doc',
  '.png': 'media',
  '.jpg': 'media',
  '.jpeg': 'media',
  '.gif': 'media',
  '.webp': 'media',
  '.heic': 'media',
  '.mp4': 'media',
  '.mov': 'media',
  '.mp3': 'media',
  '.m4a': 'media',
  '.wav': 'media',
}

const WriteResult = z.object({ written: z.string() })

export function libraryItems(store: Store, workspace: Workspace, botId: string): LibraryItem[] {
  const writtenAt = new Map<string, number>()
  for (const entry of store.toolEntries(botId, 'write_file')) {
    if (entry.kind !== 'tool') continue
    const result = WriteResult.safeParse(entry.output)
    if (result.success) writtenAt.set(result.data.written, entry.at)
  }
  return [...writtenAt]
    .filter(([file]) => workspace.has(file))
    .map(([file, at]) => ({ kind: kindOf(file), path: file, writtenAt: at }))
    .sort((a, b) => b.writtenAt - a.writtenAt)
}

/** Any file in the library, not only those listed: a bot's command can copy one in, and its replies link to it. */
export function libraryFile(workspace: Workspace, wanted: string) {
  if (!workspace.has(wanted)) throw new Error(strings().harness.library.missing(wanted))
  const absolute = workspace.resolve(wanted)
  return { absolute, kind: kindOf(absolute) }
}

const kindOf = (file: string) => KIND_BY_EXTENSION[path.extname(file).toLowerCase()] ?? 'file'
