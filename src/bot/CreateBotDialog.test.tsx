import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { renderDemoApp } from '../demo/renderDemoApp'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const section = (name: string) => screen.getByRole('region', { name })

it('has no search button; + opens the dialog with 12 shapes and 12 colours', async () => {
  const { user } = renderDemoApp()
  expect(screen.queryByRole('button', { name: '搜索' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '新建 Bot' }))
  const dialog = screen.getByRole('dialog', { name: '招一个新 Bot' })
  expect(within(within(dialog).getByRole('radiogroup', { name: '外形' })).getAllByRole('radio')).toHaveLength(12)
  expect(within(within(dialog).getByRole('radiogroup', { name: '配色' })).getAllByRole('radio')).toHaveLength(12)
  expect(within(dialog).getByRole('button', { name: '创建' })).toBeDisabled()
  await user.click(within(dialog).getByRole('button', { name: '取消' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('creates a bot with the picked look, opens its chat, and keeps it after reload', async () => {
  const { user, unmount, bridge } = renderDemoApp()
  await user.click(screen.getByRole('button', { name: '新建 Bot' }))
  const dialog = screen.getByRole('dialog', { name: '招一个新 Bot' })
  await user.click(within(dialog).getByRole('radio', { name: '猫猫' }))
  await user.click(within(dialog).getByRole('radio', { name: '薄荷' }))
  expect(within(dialog).getByRole('radio', { name: '猫猫' })).toHaveAttribute('aria-checked', 'true')
  await user.type(within(dialog).getByRole('textbox', { name: 'Bot 名称' }), '  写作助手  ')
  await user.click(within(dialog).getByRole('button', { name: '创建' }))

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: '跟 写作助手 说点什么' })).toBeInTheDocument()
  expect(within(section('其他')).getByText('写作助手')).toBeInTheDocument()
  expect(screen.getByText(/你好，我是写作助手/)).toBeInTheDocument()
  const saved = await bridge.getSidebar()
  expect(saved?.bots).toContainEqual(expect.objectContaining({ name: '写作助手', shape: 'cat', color: '#2BC48A' }))

  unmount()
  renderDemoApp(bridge, saved ?? undefined)
  expect(screen.getByRole('textbox', { name: '跟 写作助手 说点什么' })).toBeInTheDocument()
})

it('creates with Enter and ignores a blank name', async () => {
  const { user } = renderDemoApp()
  await user.click(screen.getByRole('button', { name: '新建 Bot' }))
  const input = screen.getByRole('textbox', { name: 'Bot 名称' })
  await user.type(input, '   {enter}')
  expect(screen.getByRole('dialog', { name: '招一个新 Bot' })).toBeInTheDocument()
  await user.type(input, '日报{enter}')
  expect(screen.getByRole('textbox', { name: '跟 日报 说点什么' })).toBeInTheDocument()
})

it('leaves an Enter that picks a candidate in a Chinese input method to the input method', async () => {
  const { user } = renderDemoApp()
  await user.click(screen.getByRole('button', { name: '新建 Bot' }))
  const name = screen.getByRole('textbox', { name: 'Bot 名称' })
  await user.type(name, 'xie')
  fireEvent.keyDown(name, { key: 'Enter', isComposing: true })
  expect(screen.getByRole('dialog', { name: '招一个新 Bot' })).toBeInTheDocument()
})
