import { useFlash } from './useFlash'
import { strings } from '../../shared/strings'

type Copied = 'done' | 'failed'

export const COPIED_LABEL: Record<Copied, string> = strings().ui.copied

/** The one way to the clipboard: tells the control that copied how it went, for it to say so for a moment. */
export function useCopy() {
  const [copied, flash] = useFlash<Copied>()
  // an image comes as a pending blob: Safari takes the write only while the click is still on the stack
  const copy = async (content: string | Promise<Blob>) => {
    try {
      await (typeof content === 'string'
        ? navigator.clipboard.writeText(content)
        : navigator.clipboard.write([new ClipboardItem({ 'image/png': content })]))
      flash('done')
    } catch {
      flash('failed')
    }
  }
  return [copied, copy] as const
}
