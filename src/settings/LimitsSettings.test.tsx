import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { DEFAULT_LIMITS, type Limits } from '../../shared/limits'
import { LimitsSettings } from './LimitsSettings'

afterEach(cleanup)

const renderPage = (limits: Limits = DEFAULT_LIMITS, onLimitsChange = vi.fn(async () => {})) => {
  render(<LimitsSettings limits={limits} onLimitsChange={onLimitsChange} />)
  return onLimitsChange
}

it('has a field for every limit', () => {
  renderPage()
  expect(screen.getAllByRole('spinbutton')).toHaveLength(Object.keys(DEFAULT_LIMITS).length)
})

it('saves a changed value once its field is left', async () => {
  const user = userEvent.setup()
  const onLimitsChange = renderPage()
  const steps = screen.getByRole('spinbutton', { name: '每轮步数' })
  await user.clear(steps)
  await user.type(steps, '50')
  expect(onLimitsChange).not.toHaveBeenCalled()
  await user.tab()
  expect(onLimitsChange).toHaveBeenCalledWith({ ...DEFAULT_LIMITS, chatSteps: 50 })
})

it('says 已保存 once a changed value is saved', async () => {
  const user = userEvent.setup()
  renderPage()
  const steps = screen.getByRole('spinbutton', { name: '每轮步数' })
  await user.clear(steps)
  await user.type(steps, '50')
  await user.tab()
  expect(await screen.findByRole('status')).toHaveTextContent('已保存')
})

it('marks a value out of range and does not save it', async () => {
  const user = userEvent.setup()
  const onLimitsChange = renderPage()
  const running = screen.getByRole('spinbutton', { name: '同时运行' })
  await user.clear(running)
  await user.type(running, '0{Enter}')
  expect(running).toHaveAttribute('aria-invalid', 'true')
  expect(onLimitsChange).not.toHaveBeenCalled()
})

it('restores every default in one click, and has nothing to restore while all are defaults', async () => {
  const user = userEvent.setup()
  const onLimitsChange = renderPage({ ...DEFAULT_LIMITS, chatSteps: 50, taskSteps: 300 })
  await user.click(screen.getByRole('button', { name: '恢复默认值' }))
  expect(onLimitsChange).toHaveBeenCalledWith(DEFAULT_LIMITS)
  cleanup()
  renderPage()
  expect(screen.getByRole('button', { name: '恢复默认值' })).toBeDisabled()
})

it('clears a value out of range when the defaults are restored', async () => {
  const user = userEvent.setup()
  renderPage({ ...DEFAULT_LIMITS, chatSteps: 50 })
  const running = screen.getByRole('spinbutton', { name: '同时运行' })
  await user.clear(running)
  await user.type(running, '0{Enter}')
  await user.click(screen.getByRole('button', { name: '恢复默认值' }))
  expect(screen.getByRole('spinbutton', { name: '同时运行' })).toHaveValue(3)
  expect(screen.getByRole('spinbutton', { name: '同时运行' })).toHaveAttribute('aria-invalid', 'false')
})

it('shows why a value was not saved', async () => {
  const user = userEvent.setup()
  renderPage(
    DEFAULT_LIMITS,
    vi.fn(async () => {
      throw new Error("Error invoking remote method 'nengyongbot:setLimits': Error: 写不进 limits.json")
    }),
  )
  const steps = screen.getByRole('spinbutton', { name: '每轮步数' })
  await user.clear(steps)
  await user.type(steps, '50{Enter}')
  expect(await screen.findByRole('alert')).toHaveTextContent('写不进 limits.json')
})
