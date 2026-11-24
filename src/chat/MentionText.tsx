import type { Bot } from '../../shared/bot'
import { MentionChip } from './MentionChip'
import { mentionSegments } from './mentionSegments'

/** Sent text with each @name of a bot drawn as a chip. */
export function MentionText({ text, bots }: { text: string; bots: Bot[] }) {
  return mentionSegments(text, bots).map((segment) =>
    segment.kind === 'text' ? segment.text : <MentionChip key={segment.start} bot={segment.bot} />,
  )
}
