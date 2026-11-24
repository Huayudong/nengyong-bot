import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Island } from './Island'

afterEach(() => vi.restoreAllMocks())

it('takes the size of what it holds on its first render, without waiting for an animation frame', () => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(133)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(30)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0) // a hidden window runs no frames
  render(<Island view="idle">CEO Lv.1</Island>)
  expect(screen.getByText('CEO Lv.1').closest('[aria-live]')).toHaveStyle({ width: '133px', height: '30px' })
})
