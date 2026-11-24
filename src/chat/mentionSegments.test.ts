import { describe, expect, it } from 'vitest'
import type { Bot } from '../../shared/bot'
import { mentionSegments } from './mentionSegments'

const bot = (id: string, name: string): Bot => ({ id, name, shape: 'blob', color: '#1E1E22' })
const BOTS = [
  bot('secretary', '秘书Bot'),
  bot('short', '秘书'),
  bot('github', 'GitHub 数据日报'),
  bot('odd', 'C++ (beta)'),
]

const parts = (text: string) =>
  mentionSegments(text, BOTS).map((segment) =>
    segment.kind === 'mention' ? `<${segment.bot.id}@${segment.start}>` : segment.text,
  )

describe('mentionSegments', () => {
  it('splits out each @name of a known bot with where it starts', () => {
    expect(parts('@秘书Bot 帮我问问 @GitHub 数据日报 今天')).toEqual([
      '<secretary@0>',
      ' 帮我问问 ',
      '<github@12>',
      ' 今天',
    ])
  })

  it('takes the longest name when one name starts another', () => {
    expect(parts('@秘书Bot你好')).toEqual(['<secretary@0>', '你好'])
    expect(parts('@秘书 你好')).toEqual(['<short@0>', ' 你好'])
  })

  it('leaves an @ inside a word, an unknown name and names with regex characters alone or matched literally', () => {
    expect(parts('me@秘书Bot')).toEqual(['me@秘书Bot'])
    expect(parts('@陌生人 在吗')).toEqual(['@陌生人 在吗'])
    expect(parts('@C++ (beta)')).toEqual(['<odd@0>'])
  })
})
