import { expect, it } from 'vitest'
import { type MiniApp, miniAppIdsIn, versionAt } from './miniApp'

const app: MiniApp = {
  id: 'a1',
  name: '收入汇总',
  icon: 'chart',
  color: 'sky',
  versions: [
    { version: 1, change: '第一版', at: 100 },
    { version: 2, change: '加了按月', at: 200 },
  ],
  dataAt: null,
}

it('finds each linked mini app once, in order', () => {
  expect(miniAppIdsIn('看 [收入](app:a1) 和 [日报](app:b-2)，再看 [收入](app:a1)')).toEqual(['a1', 'b-2'])
})

it('ignores bot and flow links', () => {
  expect(miniAppIdsIn('[秘书](bot:secretary) [周报](flow:f1)')).toEqual([])
})

it('gives the version that was the latest when a reply was written', () => {
  expect(versionAt(app, 150).version).toBe(1)
  expect(versionAt(app, 250).version).toBe(2)
})
