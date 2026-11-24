import { expect, it } from 'vitest'
import { MAIN_BOT, PALETTE, PICKER_SHAPES } from './bot'
import { SidebarState } from './sidebar'

const github = { id: 'github', name: 'GitHub 数据日报', shape: 'mushroom', color: '#1E1E22' }

it('rejects a value that is not a sidebar at all', () => {
  expect(SidebarState.safeParse('junk').success).toBe(false)
})

it('resets only the broken fields and drops references to unknown bots and sections', () => {
  const loaded = SidebarState.parse({
    bots: [MAIN_BOT, github],
    sections: [{ id: 'a', name: '甲' }, { id: 7 }, 'x'],
    placement: { github: 'a', relay: 'missing', ghost: 'a', body: 5 },
    pinned: ['chief', 'ghost', 'chief', 3],
    hidden: 'nope',
    ungroupedCollapsed: 'yes',
  })
  expect(loaded.sections).toEqual([{ id: 'a', name: '甲', collapsed: false }])
  expect(loaded.placement).toEqual({ github: 'a' })
  expect(loaded.pinned).toEqual(['chief'])
  expect(loaded.hidden).toEqual([])
  expect(loaded.ungroupedCollapsed).toBe(false)
  expect(loaded.hiddenCollapsed).toBe(true)
})

it('drops duplicate and malformed bots, the main bot first even when it is missing', () => {
  const loaded = SidebarState.parse({
    bots: [
      { id: 'b1', name: '写作助手', shape: 'cat', color: '#2BC48A' },
      { id: 'b1', name: 'dup', shape: 'blob', color: '#1E1E22' }, // duplicate id
      { id: '../etc', name: 'z', shape: 'blob', color: '#1E1E22' }, // not a bot id
      { id: 'b4', name: '字'.repeat(60), shape: 'blob', color: '#1E1E22' }, // too long: truncated, not dropped
    ],
    pinned: ['b1', '../etc'],
  })
  expect(loaded.bots.map((bot) => [bot.id, bot.name.length])).toEqual([
    ['chief', 3],
    ['b1', 4],
    ['b4', 40],
  ])
  expect(loaded.pinned).toEqual(['b1'])
})

it('keeps a bot whose look is no longer offered, with the closest colour and a picker shape', () => {
  const loaded = SidebarState.parse({
    bots: [
      { id: 'b2', name: 'x', shape: 'triangle', color: '#000' },
      { id: 'b3', name: 'y', shape: 'blob', color: 'red' },
    ],
  })
  const [, old, unparsable] = loaded.bots
  expect(PICKER_SHAPES).toContain(old.shape)
  expect(old.color).toBe('#1E1E22')
  expect(unparsable).toMatchObject({ shape: 'blob', color: PALETTE[0].value })
})

it('keeps the main bot and up to 200 created bots', () => {
  const created = Array.from({ length: 205 }, (_, index) => ({
    id: `b${index}`,
    name: 'x',
    shape: 'blob',
    color: '#1E1E22',
  }))
  expect(SidebarState.parse({ bots: created }).bots).toHaveLength(201)
})

it('reads the unread list of older saves as one reply each, and drops counts of unknown bots', () => {
  expect(SidebarState.parse({ bots: [MAIN_BOT, github], unread: ['github', 'ghost'] }).unread).toEqual({ github: 1 })
  expect(SidebarState.parse({ bots: [MAIN_BOT, github], unread: { github: 3, ghost: 2 } }).unread).toEqual({
    github: 3,
  })
})

it('keeps when each known bot was last looked at, drops unknown bots and reads a broken time as never', () => {
  expect(SidebarState.parse({ bots: [MAIN_BOT, github], seenAt: { github: 5, ghost: 6, chief: 'x' } }).seenAt).toEqual({
    github: 5,
    chief: 0,
  })
  expect(SidebarState.parse({ bots: [MAIN_BOT] }).seenAt).toEqual({})
})
