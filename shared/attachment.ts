/** A file the user attaches to a message, on its way from the renderer to the harness. */
export interface AttachmentFile {
  name: string
  data: Uint8Array
}

// the image formats the model reads; other images (heic, svg…) travel as plain files
const IMAGE_TYPE_BY_EXTENSION = new Map([
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['gif', 'image/gif'],
  ['webp', 'image/webp'],
])

/** The media type of an attachment the model sees as an image, undefined for any other file. */
export function imageType(name: string): string | undefined {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? undefined : IMAGE_TYPE_BY_EXTENSION.get(name.slice(dot + 1).toLowerCase())
}
