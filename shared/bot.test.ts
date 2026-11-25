import { describe, expect, it } from 'vitest'
import { Bot, MAIN_BOT, StoredBot } from './bot'

const AVATAR = 'data:image/webp;base64,AAAA'

describe('bot avatars', () => {
  it('keeps an uploaded picture when a saved bot is read back', () => {
    expect(StoredBot.parse({ ...MAIN_BOT, avatar: AVATAR })).toMatchObject({ id: MAIN_BOT.id, avatar: AVATAR })
  })

  it('drops a saved picture that is not one of the image data URLs the app writes', () => {
    const stored = StoredBot.parse({ ...MAIN_BOT, avatar: 'https://example.com/avatar.png' })
    expect(stored.avatar).toBeUndefined()
    expect(stored.id).toBe(MAIN_BOT.id)
  })

  it('refuses a picture larger than the sidebar can carry', () => {
    const huge = `data:image/webp;base64,${'A'.repeat(500_000)}`
    expect(Bot.safeParse({ ...MAIN_BOT, avatar: huge }).success).toBe(false)
  })
})
