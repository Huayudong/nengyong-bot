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

describe('bot outfits', () => {
  it('keeps the crown on a main bot saved before outfits existed', () => {
    const { outfit: _, ...saved } = MAIN_BOT
    expect(StoredBot.parse(saved).outfit).toEqual(['goldCrown'])
  })

  it('keeps the main bot bare once its crown was taken off', () => {
    expect(StoredBot.parse({ ...MAIN_BOT, outfit: [] }).outfit).toEqual([])
  })

  it('drops a saved piece of outfit that no longer exists and keeps the rest', () => {
    const stored = StoredBot.parse({ ...MAIN_BOT, id: 'b1', outfit: ['sunglasses', 'jetpack'] })
    expect(stored.outfit).toEqual(['sunglasses'])
  })
})
