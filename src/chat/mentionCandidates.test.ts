import { describe, expect, it } from 'vitest'
import { DEMO_SIDEBAR } from '../demo/demoData'
import { mentionCandidates, mentionQuery } from './mentionCandidates'

const names = (query: string, sidebar = DEMO_SIDEBAR, selfId = 'chief') =>
  mentionCandidates(sidebar, selfId, query).map((candidate) => candidate.bot.name)

describe('mentionQuery', () => {
  it('finds the word after an @ at the start or after a space, up to the caret', () => {
    expect(mentionQuery('@git', 4)).toEqual({ start: 0, end: 4, query: 'git' })
    expect(mentionQuery('问问 @', 4)).toEqual({ start: 3, end: 4, query: '' })
    expect(mentionQuery('问问 @git 吧', 7)).toEqual({ start: 3, end: 7, query: 'git' })
  })

  it('ignores an @ inside a word or one the caret has moved past a space from', () => {
    expect(mentionQuery('me@mail', 7)).toBeNull()
    expect(mentionQuery('@git ', 5)).toBeNull()
    expect(mentionQuery('@git', 0)).toBeNull()
  })
})

describe('mentionCandidates', () => {
  it('offers every other shown bot in sidebar order, each with its group, none for 其他', () => {
    const candidates = mentionCandidates(DEMO_SIDEBAR, 'chief', '')
    expect(candidates.map(({ bot, group }) => [bot.id, group])).toEqual([
      ['secretary', undefined],
      ['repo', '我的 App'],
      ['content', '我的 App'],
      ['support', '我的 App'],
      ['release', '我的 App'],
      ['travel', '生活'],
      ['fitness', '生活'],
      ['ledger', '家庭'],
      ['ideas', undefined],
    ])
  })

  it('keeps hidden bots out until the user types, then lists names starting with the query first', () => {
    const sidebar = { ...DEMO_SIDEBAR, hidden: ['repo'] }
    expect(names('', sidebar)).not.toContain('GitHub 数据日报')
    expect(names('g', sidebar)).toEqual(['GitHub 数据日报', 'Bug 反馈整理'])
  })

  it('matches names ignoring case and returns nothing when none match', () => {
    expect(names('GITHUB')).toEqual(['GitHub 数据日报'])
    expect(names('不存在')).toEqual([])
  })
})
