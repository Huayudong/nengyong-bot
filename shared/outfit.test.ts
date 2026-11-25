import { describe, expect, it } from 'vitest'
import { isUnlocked, OUTFITS, OutfitId, toggleOutfit, unlockedAt } from './outfit'
import { TIERS } from './trust'

describe('toggleOutfit', () => {
  it('puts a piece on in place of the one its slot held', () => {
    expect(toggleOutfit(['partyHat', 'sunglasses'], 'bronzeCrown')).toEqual(['sunglasses', 'bronzeCrown'])
  })

  it('takes off the piece that is already worn', () => {
    expect(toggleOutfit(['partyHat', 'sunglasses'], 'partyHat')).toEqual(['sunglasses'])
  })
})

describe('isUnlocked', () => {
  it('unlocks a piece from its level on', () => {
    expect(isUnlocked('silverCrown', 29, false)).toBe(false)
    expect(isUnlocked('silverCrown', 30, false)).toBe(true)
  })

  it('lets the main bot wear its gold crown at any level, and nothing else early', () => {
    expect(isUnlocked('goldCrown', 1, true)).toBe(true)
    expect(isUnlocked('silverCrown', 1, true)).toBe(false)
  })
})

it('unlocks pieces only where a tier starts, so each new tier brings some', () => {
  const tierStarts: number[] = TIERS.map((tier) => tier.from)
  expect(OutfitId.options.filter((id) => !tierStarts.includes(OUTFITS[id].from))).toEqual([])
  expect(tierStarts.filter((level) => unlockedAt(level).length === 0)).toEqual([])
})

it('lists what a level unlocks', () => {
  expect(unlockedAt(30)).toEqual(['silverCrown', 'tie'])
  expect(unlockedAt(31)).toEqual([])
})
