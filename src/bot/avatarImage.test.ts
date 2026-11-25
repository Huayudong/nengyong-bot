import { describe, expect, it } from 'vitest'
import { centeredCrop, clampCrop, cropRect } from './avatarImage'

describe('avatar crop', () => {
  it('starts on the centre with the whole shorter side', () => {
    expect(centeredCrop(1200, 800)).toEqual({ zoom: 1, centerX: 600, centerY: 400 })
  })

  it('keeps the square inside the picture when the frame is dragged past an edge', () => {
    expect(clampCrop({ zoom: 1, centerX: 0, centerY: 9999 }, 1200, 800)).toEqual({
      zoom: 1,
      centerX: 400,
      centerY: 400,
    })
  })

  it('zooms into a smaller square around the same centre', () => {
    expect(cropRect({ zoom: 2, centerX: 600, centerY: 400 }, 1200, 800)).toEqual({ x: 400, y: 200, size: 400 })
  })

  it('holds the zoom between one and five', () => {
    expect(clampCrop({ zoom: 9, centerX: 600, centerY: 400 }, 1200, 800).zoom).toBe(5)
    expect(clampCrop({ zoom: 0.2, centerX: 600, centerY: 400 }, 1200, 800).zoom).toBe(1)
  })
})
