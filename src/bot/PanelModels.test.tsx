import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { PanelModels } from './PanelModels'

afterEach(cleanup)

const rowOf = (label: string) => {
  const row = within(screen.getByRole('list', { name: '模型' }))
    .getAllByRole('listitem')
    .find((item) => item.textContent?.startsWith(label))
  if (!row) throw new Error(`没有「${label}」这一行`)
  return within(row)
}

it('shows the model its tasks were switched to, apart from its chat', () => {
  const tasks = { model: 'qwen/qwen3.8-27b', isGone: false }
  render(<PanelModels models={{ main: 'deepseek-flash', chat: null, tasks }} entries={[]} />)
  expect(rowOf('聊天').getByText('deepseek-flash')).toBeInTheDocument()
  expect(rowOf('后台任务').getByText('qwen/qwen3.8-27b')).toBeInTheDocument()
  expect(rowOf('后台任务').getByText(/你在聊天里让它换的/)).toBeInTheDocument()
})

it('says its tasks run on the main model once the account of their model is gone', () => {
  const tasks = { model: 'qwen/qwen3.8-27b', isGone: true }
  render(<PanelModels models={{ main: 'deepseek-flash', chat: null, tasks }} entries={[]} />)
  expect(rowOf('后台任务').getByText('账号已断开，用主模型 deepseek-flash')).toBeInTheDocument()
})
