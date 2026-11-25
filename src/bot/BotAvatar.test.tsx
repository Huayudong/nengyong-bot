import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MAIN_BOT } from '../../shared/bot'
import { BotAvatar } from './BotAvatar'

afterEach(cleanup)

const AVATAR = 'data:image/webp;base64,AAAA'

it('draws the uploaded picture instead of the shape', () => {
  const { container } = render(<BotAvatar bot={{ ...MAIN_BOT, avatar: AVATAR }} size={64} />)
  expect(container.querySelector('img')?.getAttribute('src')).toBe(AVATAR)
  expect(container.querySelector('svg')).toBeNull()
})

it('draws the shape when no picture was uploaded', () => {
  const { container } = render(<BotAvatar bot={MAIN_BOT} size={64} />)
  expect(container.querySelector('svg')).not.toBeNull()
  expect(container.querySelector('img')).toBeNull()
})
