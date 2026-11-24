import fs from 'node:fs'
import path from 'node:path'
import type { FilePart, TextPart } from 'ai'
import { type AttachmentFile, imageType } from '../shared/attachment'
import { newId } from '../shared/newId'
import type { Workspace } from './workspace'

const UPLOADS_DIR = 'uploads'

/** Saves what the user attached into the library, each in a folder of its own so names never clash, and returns their library paths. */
export function saveAttachments(workspace: Workspace, files: AttachmentFile[]): string[] {
  return files.map((file) => workspace.write(path.join(UPLOADS_DIR, newId(''), safeName(file.name)), file.data))
}

// the name comes from the renderer: keep letters and digits of any script, drop separators and anything odd
const safeName = (name: string) => path.basename(name).replace(/[^\p{L}\p{N}._ ()-]/gu, '_')

/** A user message with attachments: every file is named by its library path, and images go along as images. */
export function withAttachments(workspace: Workspace, text: string, attachments: string[]): (TextPart | FilePart)[] {
  const note = `（用户附上的文件，已存进本地资料库：${attachments.join('、')}）`
  return [
    { type: 'text', text: text ? `${text}\n\n${note}` : note },
    ...attachments.flatMap((file) => image(workspace, file)),
  ]
}

function image(workspace: Workspace, file: string): FilePart[] {
  const mediaType = imageType(file)
  if (!mediaType) return []
  try {
    return [{ type: 'file', data: fs.readFileSync(workspace.resolve(file)), mediaType }]
  } catch {
    return [] // deleted from the library since: the note still names it, the turn goes on without the picture
  }
}
