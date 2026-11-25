import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { secretary } from '../../shared/bot'
import { OutfitPicker } from './OutfitPicker'

afterEach(cleanup)

it('takes off a piece the bot still wears after its level fell below it', async () => {
  const onPick = vi.fn()
  render(<OutfitPicker bot={{ ...secretary(), outfit: ['sunglasses'] }} level={9} onPick={onPick} />)
  await userEvent.click(screen.getByRole('button', { name: '墨镜' }))
  expect(onPick).toHaveBeenCalledWith([])
})
