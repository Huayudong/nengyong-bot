import { z } from 'zod'

/** The input field of every tool that hands out a long text in windows. */
export const Offset = z
  .number()
  .int()
  .min(0)
  .default(0)
  .describe('跳过前多少个字；内容很长时，照上次结果末尾提示的 offset 续读')

/** One window of a long text, ending with where to read on: the rest stays out of the model's context until asked for. */
export function textWindow(text: string, offset: number, windowChars: number): string {
  if (offset > 0 && offset >= text.length) throw new Error(`offset 超出范围：全文共 ${text.length} 字`)
  const end = offset + clip(text.slice(offset), windowChars).length
  if (offset === 0 && end === text.length) return text
  const next = end < text.length ? `；要看后面，用 offset=${end} 再读` : '，已到结尾'
  return `${text.slice(offset, end)}\n…（第 ${offset + 1}–${end} 字，共 ${text.length} 字${next}）`
}

/** The first `maxChars` characters of a text. */
export function clip(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const last = text.charCodeAt(maxChars - 1)
  // never end on the first half of a surrogate pair (emoji): a lone half makes the request JSON invalid for strict parsers
  return text.slice(0, last >= 0xd800 && last <= 0xdbff ? maxChars - 1 : maxChars)
}
