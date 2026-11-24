import type { Bot } from '../../shared/bot'

type MentionSegment =
  | { kind: 'text'; start: number; text: string }
  | { kind: 'mention'; start: number; text: string; bot: Bot }

/** Splits text at each @name of a known bot: at the start or after whitespace; when one name starts another, the longer wins. */
export function mentionSegments(text: string, bots: Bot[]): MentionSegment[] {
  const longestFirst = bots.toSorted((a, b) => b.name.length - a.name.length)
  const pattern = new RegExp(`(?<=^|\\s)@(?:${longestFirst.map((bot) => escapeRegExp(bot.name)).join('|')})`, 'g')
  const segments: MentionSegment[] = []
  let end = 0
  for (const match of bots.length > 0 ? text.matchAll(pattern) : []) {
    const bot = longestFirst.find((candidate) => candidate.name === match[0].slice(1))
    if (!bot) continue
    if (match.index > end) segments.push({ kind: 'text', start: end, text: text.slice(end, match.index) })
    segments.push({ kind: 'mention', start: match.index, text: match[0], bot })
    end = match.index + match[0].length
  }
  return end < text.length ? [...segments, { kind: 'text', start: end, text: text.slice(end) }] : segments
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
