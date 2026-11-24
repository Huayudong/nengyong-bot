import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { type Bot, secretary } from '../../shared/bot'
import type { OnboardingChoices } from '../../shared/bridge'
import type { ModelServicesView } from '../../shared/modelServices'
import { Onboarding } from './Onboarding'

afterEach(cleanup)

const noAccounts: ModelServicesView = { accounts: [], chat: null, searchAccountId: null }
const hired = (choices: OnboardingChoices): Bot[] => [
  secretary(),
  ...choices.hires.map(({ duty: _duty, ...look }, index) => ({ ...look, id: `hired-${index}` })),
]

function renderOnboarding(overrides: Partial<Parameters<typeof Onboarding>[0]> = {}) {
  const props = {
    modelServices: noAccounts,
    onConnectModel: vi.fn(async (_apiKey: string) => {}),
    onHire: vi.fn(async (choices: OnboardingChoices) => hired(choices)),
    onDone: vi.fn(),
    theme: 'light' as const,
    onThemeChange: vi.fn(),
  }
  render(<Onboarding {...props} {...overrides} />)
  return { props, user: userEvent.setup() }
}

const next = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(await screen.findByRole('button', { name: '下一步' }))

it('names the boss, learns the address, hires the kept candidates and ends once they land', async () => {
  const { props, user } = renderOnboarding()
  await user.type(await screen.findByRole('textbox', { name: '先给我起个名字吧' }), '小猪{enter}')
  await user.type(await screen.findByRole('textbox', { name: '我该怎么称呼你？' }), '老朱{enter}')
  expect(await screen.findByRole('heading', { name: '你好，老朱！' })).toBeInTheDocument()
  await next(user)
  await next(user)
  await next(user)
  await user.click(await screen.findByRole('button', { name: '稍后再说' }))
  await user.click(await screen.findByRole('button', { name: '产品经理' }))
  await user.click(screen.getByRole('button', { name: /^PRD 助手/ }))
  await user.click(screen.getByRole('button', { name: '组建团队' }))

  const choices = props.onHire.mock.calls[0]?.[0]
  expect(choices?.bossName).toBe('小猪')
  expect(choices?.address).toBe('老朱')
  expect(choices?.hires.map((hire) => hire.name)).toEqual(['竞品分析师', '需求整理员', '访谈整理员', '数据周报员'])
  expect(choices?.suggestions).toContain('你都会些什么？')
  await waitFor(() => expect(props.onDone).toHaveBeenCalled(), { timeout: 4000 })
})

it('keeps the default name and asks for no address when both answers are left empty', async () => {
  const { props, user } = renderOnboarding()
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await next(user)
  await user.click(await screen.findByRole('button', { name: '跳过介绍' }))
  await user.click(await screen.findByRole('button', { name: '稍后再说' }))
  await user.click(await screen.findByRole('button', { name: '跳过' }))
  expect(props.onHire).toHaveBeenCalledWith(expect.objectContaining({ bossName: 'CEO', address: '', hires: [] }))
})

it('lets go of the picked identity when it is clicked again', async () => {
  const { user } = renderOnboarding()
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await next(user)
  await user.click(await screen.findByRole('button', { name: '跳过介绍' }))
  await user.click(await screen.findByRole('button', { name: '稍后再说' }))
  const developer = await screen.findByRole('button', { name: '程序员' })
  await user.click(developer)
  expect(developer).toHaveAttribute('aria-pressed', 'true')
  await user.click(developer)
  expect(developer).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: '组建团队' })).toBeDisabled()
})

it('stays on the step with the reason when the key does not connect', async () => {
  const onConnectModel = vi.fn(async () => {
    throw new Error('Error invoking remote method: Error: Key 不对（401）')
  })
  const { user } = renderOnboarding({ onConnectModel })
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await next(user)
  await user.click(await screen.findByRole('button', { name: '跳过介绍' }))
  await user.type(await screen.findByLabelText('API Key'), 'sk-wrong{enter}')
  expect(await screen.findByText('连接失败：Key 不对（401）')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '连接' })).toBeInTheDocument()
})

it('connects DeepSeek with the key typed and then lets the boss go on', async () => {
  const { props, user } = renderOnboarding()
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await next(user)
  await user.click(await screen.findByRole('button', { name: '跳过介绍' }))
  await user.type(await screen.findByLabelText('API Key'), 'sk-right{enter}')
  expect(props.onConnectModel).toHaveBeenCalledWith('sk-right')
  expect(await screen.findByRole('button', { name: '下一步' })).toBeInTheDocument()
})

it('goes back to the identities with the reason when hiring fails', async () => {
  const { user } = renderOnboarding({ onHire: vi.fn(async () => Promise.reject(new Error('磁盘满了'))) })
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await user.click(await screen.findByRole('button', { name: '确定' }))
  await next(user)
  await user.click(await screen.findByRole('button', { name: '跳过介绍' }))
  await user.click(await screen.findByRole('button', { name: '稍后再说' }))
  await user.click(await screen.findByRole('button', { name: '测试' }))
  await user.click(screen.getByRole('button', { name: '组建团队' }))
  expect(await screen.findByText('组建团队失败：磁盘满了')).toBeInTheDocument()
})

it('switches a light theme to dark from the toggle in the corner', async () => {
  const { props, user } = renderOnboarding()
  await user.click(screen.getByRole('button', { name: '深色模式', pressed: false }))
  expect(props.onThemeChange).toHaveBeenCalledWith('dark')
})

it('switches a dark theme back to light from the toggle in the corner', async () => {
  const { props, user } = renderOnboarding({ theme: 'dark' })
  await user.click(screen.getByRole('button', { name: '深色模式', pressed: true }))
  expect(props.onThemeChange).toHaveBeenCalledWith('light')
})
