import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { renderDemoApp } from '../demo/renderDemoApp'

// the app keeps the open bot and the panel in localStorage; each test starts from the defaults
beforeEach(() => localStorage.clear())
afterEach(cleanup)

async function openContentBot() {
  const rendered = renderDemoApp()
  await rendered.user.click(screen.getByRole('button', { name: /内容运营/ }))
  return rendered
}

async function openRevenueFromChat() {
  const rendered = await openContentBot()
  const [card] = await screen.findAllByRole('button', { name: '打开小程序 收入汇总' })
  if (!card) throw new Error('no card for 收入汇总')
  await rendered.user.click(card)
  return rendered
}

it("lists the bot's mini apps with their versions in the panel's 小程序 tab", async () => {
  const { user } = await openContentBot()
  await user.click(screen.getByRole('button', { name: '展开面板' }))
  const panel = screen.getByRole('complementary', { name: 'Bot 详情' })
  await user.click(within(panel).getByRole('button', { name: '小程序' }))
  const list = await within(panel).findByRole('list', { name: '小程序' })
  expect(within(list).getByRole('button', { name: /收入汇总\s*v2/ })).toBeInTheDocument()
  expect(within(list).getByRole('button', { name: /运营日报\s*v1/ })).toBeInTheDocument()
})

it('opens a mini app from its card in the chat, in a window with the capsule buttons', async () => {
  await openRevenueFromChat()
  const window = screen.getByRole('region', { name: '收入汇总' })
  for (const name of ['更多', '收起到浮窗', '关闭']) expect(within(window).getByRole('button', { name })).toBeVisible()
  expect(screen.getByText(/你在看/)).toBeInTheDocument()
})

it('minimizes a mini app to the dock and brings it back from there', async () => {
  const { user } = await openRevenueFromChat()
  await user.click(within(screen.getByRole('region', { name: '收入汇总' })).getByRole('button', { name: '收起到浮窗' }))
  expect(screen.queryByRole('region', { name: '收入汇总' })).not.toBeInTheDocument()

  const dock = screen.getByRole('toolbar', { name: '浮窗' })
  await user.click(within(dock).getByRole('button', { name: /收入汇总 v2，收起了，5 分钟后挂起/ }))
  expect(screen.getByRole('region', { name: '收入汇总' })).toBeInTheDocument()
  expect(within(dock).queryByRole('button', { name: /收入汇总/ })).not.toBeInTheDocument()
})

it('closes a mini app without putting it in the dock', async () => {
  const { user } = await openRevenueFromChat()
  await user.click(within(screen.getByRole('region', { name: '收入汇总' })).getByRole('button', { name: '关闭' }))
  expect(screen.queryByRole('region', { name: '收入汇总' })).not.toBeInTheDocument()
  expect(within(screen.getByRole('toolbar', { name: '浮窗' })).queryAllByRole('button', { name: /收入汇总/ })).toEqual(
    [],
  )
  expect(screen.queryByText(/你在看/)).not.toBeInTheDocument()
})

it('tells the bot which mini app was open when the user wrote', async () => {
  const { user, bridge } = await openRevenueFromChat()
  await user.type(screen.getByRole('textbox', { name: /说点什么/ }), '加一条目标线{enter}')
  await waitFor(async () =>
    expect((await bridge.history('content')).findLast((entry) => entry.kind === 'user')).toMatchObject({
      text: '加一条目标线',
      miniApp: { id: 'revenue', isSentByApp: false },
    }),
  )
})
