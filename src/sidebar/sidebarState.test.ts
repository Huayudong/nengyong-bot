import { describe, expect, it } from 'vitest'
import { DEMO_SIDEBAR as DEMO } from '../demo/demoData'
import {
  addUnread,
  createBot,
  createSectionWith,
  deleteBot,
  deleteSection,
  INITIAL_SIDEBAR,
  markSeen,
  markUnseenAsSeen,
  moveSection,
  moveToSection,
  renameBot,
  renameSection,
  setBotAvatar,
  setBotLook,
  setHidden,
  setUnread,
  togglePin,
  toggleSection,
} from './sidebarState'
import { sidebarView } from '../sidebarView'

const ids = (bots: { id: string }[]) => bots.map((bot) => bot.id)

describe('sidebar updates', () => {
  it('starts with only the main bot, pinned', () => {
    const view = sidebarView(INITIAL_SIDEBAR)
    expect([ids(INITIAL_SIDEBAR.bots), ids(view.pinned), view.sections, view.ungrouped, view.hidden]).toEqual([
      ['chief'],
      ['chief'],
      [],
      [],
      [],
    ])
  })

  it('lays out pinned bots, the named sections and 其他', () => {
    const view = sidebarView(DEMO)
    expect(ids(view.pinned)).toEqual(['chief', 'secretary'])
    expect(view.sections.map((s) => s.name)).toEqual(['我的 App', '生活', '家庭'])
    expect(ids(view.ungrouped)).toEqual(['ideas'])
    expect(view.hidden).toEqual([])
  })

  it('pinning takes a bot out of its section and back', () => {
    const pinned = togglePin(DEMO, 'repo')
    expect(ids(sidebarView(pinned).pinned)).toEqual(['chief', 'secretary', 'repo'])
    expect(ids(sidebarView(pinned).sections[0].bots)).not.toContain('repo')
    expect(ids(sidebarView(togglePin(pinned, 'repo')).sections[0].bots)).toContain('repo')
  })

  it('moves bots between sections, back to 其他, and creates a new section around a bot', () => {
    const moved = moveToSection(DEMO, 'repo', 's2')
    expect(ids(sidebarView(moved).sections[1].bots)).toContain('repo')
    expect(ids(sidebarView(moveToSection(moved, 'repo', null)).ungrouped)).toContain('repo')
    const last = sidebarView(createSectionWith(moved, 'travel', 'sNew')).sections.slice(-1)[0]
    expect([last.id, last.name, ids(last.bots)]).toEqual(['sNew', '未命名分组', ['travel']])
  })

  it('renames (ignoring blanks), reorders within bounds and collapses sections', () => {
    expect(renameSection(DEMO, 's1', '  工作  ').sections[0].name).toBe('工作')
    expect(renameSection(DEMO, 's1', '   ')).toBe(DEMO)
    expect(moveSection(DEMO, 's1', 1).sections.map((s) => s.id)).toEqual(['s2', 's1', 's3'])
    expect(moveSection(DEMO, 's1', -1)).toBe(DEMO)
    expect(moveSection(DEMO, 's3', 1)).toBe(DEMO)
    expect(toggleSection(DEMO, 's2').sections[1].collapsed).toBe(true)
  })

  it('deleting a section keeps its bots in 其他', () => {
    const view = sidebarView(deleteSection(DEMO, 's1'))
    expect(view.sections.map((s) => s.id)).toEqual(['s2', 's3'])
    expect(ids(view.ungrouped)).toEqual(['repo', 'content', 'support', 'release', 'ideas'])
  })

  it('hides (and unpins) a bot and restores it', () => {
    const hidden = setHidden(DEMO, 'chief', true)
    expect(ids(sidebarView(hidden).hidden)).toEqual(['chief'])
    expect(ids(sidebarView(hidden).pinned)).toEqual(['secretary'])
    expect(ids(sidebarView(setHidden(hidden, 'chief', false)).ungrouped)).toContain('chief')
  })

  it('marks a bot unread, and leaves the state untouched when nothing changes', () => {
    expect(setUnread(DEMO, 'support', true).unread).toEqual({ support: 1 })
    expect(setUnread(DEMO, 'support', false)).toBe(DEMO)
  })

  it('counts the replies the user has not seen, and clears them all at once', () => {
    const twice = addUnread(addUnread(DEMO, 'support'), 'support')
    expect(twice.unread).toEqual({ support: 2 })
    expect(setUnread(twice, 'support', true)).toBe(twice)
    expect(setUnread(twice, 'support', false).unread).toEqual({})
  })

  it('renames a bot in place, capped at BOT_NAME_MAX; section names are capped at SECTION_NAME_MAX', () => {
    const long = '字'.repeat(100)
    expect(renameBot(DEMO, 'support', '运维').bots.find((bot) => bot.id === 'support')?.name).toBe('运维')
    expect(renameBot(DEMO, 'support', long).bots.find((bot) => bot.id === 'support')?.name).toHaveLength(40)
    expect(renameBot(DEMO, 'support', '  ')).toBe(DEMO)
    expect(renameSection(DEMO, 's1', long).sections[0].name).toHaveLength(80)
  })

  it('deletes a bot with every reference to it, but never the main bot', () => {
    const gone = deleteBot(setUnread(togglePin(DEMO, 'support'), 'support', true), 'support')
    expect(ids(gone.bots)).not.toContain('support')
    expect([gone.pinned, gone.unread, gone.placement.support]).toEqual([['chief', 'secretary'], {}, undefined])
    expect(gone.seenAt).not.toHaveProperty('support')
    expect(deleteBot(DEMO, 'chief')).toBe(DEMO)
  })

  it('remembers when the user last looked at each bot, keeping the others', () => {
    expect(markSeen({ ...DEMO, seenAt: { repo: 1 } }, ['chief', 'support'], 5).seenAt).toEqual({
      repo: 1,
      chief: 5,
      support: 5,
    })
  })

  it('counts bots never looked at as seen now, and leaves the times it already has', () => {
    const seenAt = markUnseenAsSeen({ ...DEMO, seenAt: { repo: 1 } }, 5).seenAt
    expect(seenAt.repo).toBe(1)
    expect(seenAt.support).toBe(5)
  })

  it('creates a bot into 其他 (expanded), and ignores a bot that is already there', () => {
    const created = createBot(
      { ...DEMO, ungroupedCollapsed: true },
      { id: 'b1', name: '  写作助手 ', shape: 'cat', color: '#2BC48A' },
    )
    expect(sidebarView(created).ungrouped.slice(-1)[0]).toMatchObject({ id: 'b1', name: '写作助手', shape: 'cat' })
    expect(created.ungroupedCollapsed).toBe(false)
    expect(createBot(created, { id: 'b1', name: '重复', shape: 'blob', color: '#1E1E22' })).toBe(created)
  })

  it('an uploaded picture replaces the look until a new look is picked', () => {
    const avatar = 'data:image/webp;base64,AAAA'
    const withPicture = setBotAvatar(DEMO, 'repo', avatar)
    expect(withPicture.bots.find((bot) => bot.id === 'repo')?.avatar).toBe(avatar)
    const relooked = setBotLook(withPicture, 'repo', { shape: 'cat', color: '#4A8CFF' })
    expect(relooked.bots.find((bot) => bot.id === 'repo')).toMatchObject({ shape: 'cat', color: '#4A8CFF' })
    expect(relooked.bots.find((bot) => bot.id === 'repo')?.avatar).toBeUndefined()
  })

  it('removing the picture puts the shape back', () => {
    const withPicture = setBotAvatar(DEMO, 'repo', 'data:image/webp;base64,AAAA')
    expect(setBotAvatar(withPicture, 'repo', undefined).bots.find((bot) => bot.id === 'repo')?.avatar).toBeUndefined()
  })
})
