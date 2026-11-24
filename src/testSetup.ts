import '@testing-library/jest-dom/vitest'
import { MotionGlobalConfig } from 'motion/react'
import { vi } from 'vitest'

// finish animations instantly so tests see final DOM state
MotionGlobalConfig.skipAnimations = true

// jsdom has no blob: URLs; a thumbnail only needs some src
URL.createObjectURL = () => 'blob:test'
URL.revokeObjectURL = () => {}

// jsdom has no ResizeObserver; it lays nothing out, so there is never a size change to report
vi.stubGlobal(
  'ResizeObserver',
  vi.fn(function resizeObserver() {
    return { observe() {}, unobserve() {}, disconnect() {} }
  }),
)

// jsdom has no matchMedia: tests run on a system that allows motion
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
}))
