import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { ServiceList } from './ServiceList'

afterEach(cleanup)

it('says Nengyong Key is coming soon when it is picked, without opening a form', async () => {
  const onPick = vi.fn()
  render(<ServiceList connected={[]} onPick={onPick} onClose={() => {}} />)

  await userEvent.click(screen.getByRole('button', { name: /Nengyong Key/ }))

  expect(screen.getByText('筹备中，敬请期待')).toBeTruthy()
  expect(onPick).not.toHaveBeenCalled()
})

it('leaves Nengyong Key out of a search it does not match', async () => {
  render(<ServiceList connected={[]} onPick={() => {}} onClose={() => {}} />)

  await userEvent.type(screen.getByRole('searchbox'), 'openai')

  expect(screen.queryByRole('button', { name: /Nengyong Key/ })).toBeNull()
})
