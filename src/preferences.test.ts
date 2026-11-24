import { expect, it } from 'vitest'
import { Preferences } from './preferences'

it('starts from the light theme, bot-coloured bubbles, Enter to send and debug mode on', () => {
  expect(Preferences.parse(undefined)).toEqual({ theme: 'light', accent: 'bot', sendKey: 'enter', isDebug: true })
})

it('keeps the valid choices when one stored value is stale', () => {
  expect(Preferences.parse({ theme: 'dark', accent: 'neon', isDebug: false })).toEqual({
    theme: 'dark',
    accent: 'bot',
    sendKey: 'enter',
    isDebug: false,
  })
})
