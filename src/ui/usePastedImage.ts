import { useEffect, useEffectEvent } from 'react'

/** While `isOpen`, an image pasted anywhere but a text field goes to `onImage`; text pasted into a field stays there. */
export function usePastedImage(isOpen: boolean, onImage: (file: File) => void) {
  const accept = useEffectEvent(onImage)

  useEffect(() => {
    if (!isOpen) return
    const onPaste = (event: ClipboardEvent) => {
      if (acceptsText(event.target)) return
      const image = imageOf(event.clipboardData)
      if (!image) return
      event.preventDefault()
      accept(image)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [isOpen])
}

function acceptsText(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true
  return target instanceof HTMLElement && target.isContentEditable
}

function imageOf(clipboard: DataTransfer | null): File | null {
  if (!clipboard) return null
  for (let index = 0; index < clipboard.items.length; index += 1) {
    const item = clipboard.items[index]
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (file) return file
  }
  for (let index = 0; index < clipboard.files.length; index += 1) {
    const file = clipboard.files[index]
    if (file.type.startsWith('image/')) return file
  }
  return null
}
