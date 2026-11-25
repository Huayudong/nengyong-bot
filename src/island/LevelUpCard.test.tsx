import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MAIN_BOT, secretary } from '../../shared/bot'
import { LevelUpCard } from './LevelUpCard'

afterEach(cleanup)

it('shows the outfits a level unlocks', () => {
  render(<LevelUpCard bot={secretary()} level={30} />)
  const outfits = screen.getByRole('list')
  expect(
    within(outfits)
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toEqual(['银冠', '领带'])
})

it('says nothing about outfits on a level that unlocks none', () => {
  render(<LevelUpCard bot={secretary()} level={31} />)
  expect(screen.queryByText('解锁新装扮')).not.toBeInTheDocument()
})

it('does not announce the gold crown to the main bot, which wore it from the start', () => {
  render(<LevelUpCard bot={MAIN_BOT} level={60} />)
  expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['单片眼镜'])
})
