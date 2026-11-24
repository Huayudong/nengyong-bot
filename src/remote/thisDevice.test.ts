import { expect, it } from 'vitest'
import { thisDevice } from './thisDevice'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
const IPAD_AS_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/19.0 Safari/605.1.15'
const ANDROID_PHONE = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'
const ANDROID_TABLET = 'Mozilla/5.0 (Linux; Android 15; SM-X910) AppleWebKit/537.36 Chrome/140.0 Safari/537.36'

it('calls an iPhone an iPhone', () => {
  expect(thisDevice(IPHONE, 5, false)).toEqual({ name: 'iPhone', kind: 'phone' })
})

it('tells an iPad posing as a Mac by its touch screen', () => {
  expect(thisDevice(IPAD_AS_MAC, 5, false)).toEqual({ name: 'iPad', kind: 'tablet' })
  expect(thisDevice(IPAD_AS_MAC, 0, false)).toEqual({ name: 'Mac', kind: 'computer' })
})

it('tells an Android phone from an Android tablet', () => {
  expect(thisDevice(ANDROID_PHONE, 5, false).kind).toBe('phone')
  expect(thisDevice(ANDROID_TABLET, 5, false).kind).toBe('tablet')
})

it('says when it was opened from the home screen', () => {
  expect(thisDevice(IPHONE, 5, true).name).toBe('iPhone（主屏幕）')
})
