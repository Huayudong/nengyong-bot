import { fireEvent, render, screen } from '@testing-library/react'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

function Nested() {
  const [isOuterOpen, setIsOuterOpen] = useState(true)
  const [isInnerOpen, setIsInnerOpen] = useState(true)
  return (
    <AnimatePresence>
      {isOuterOpen && (
        <Dialog labelledBy="outer" onClose={() => setIsOuterOpen(false)} className="">
          <h2 id="outer">外层</h2>
          <AnimatePresence>
            {isInnerOpen && (
              <Dialog labelledBy="inner" onClose={() => setIsInnerOpen(false)} className="">
                <h2 id="inner">内层</h2>
              </Dialog>
            )}
          </AnimatePresence>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

it('closes only the inner dialog on Esc when one dialog was opened from another', async () => {
  render(<Nested />)
  fireEvent(screen.getByRole('dialog', { name: '内层' }), new Event('cancel', { cancelable: true }))
  expect(await screen.findByRole('dialog', { name: '外层' })).toBeInTheDocument()
  await vi.waitFor(() => expect(screen.queryByRole('dialog', { name: '内层' })).not.toBeInTheDocument())
})

it('refuses to open outside an AnimatePresence, which it needs to animate out', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  expect(() =>
    render(
      <Dialog labelledBy="title" onClose={() => undefined} className="">
        <h2 id="title">标题</h2>
      </Dialog>,
    ),
  ).toThrow('AnimatePresence')
  vi.restoreAllMocks()
})

it('refuses to open inside another dialog without an AnimatePresence of its own', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  expect(() =>
    render(
      <AnimatePresence>
        <Dialog labelledBy="outer" onClose={() => undefined} className="">
          <h2 id="outer">外层</h2>
          <Dialog labelledBy="inner" onClose={() => undefined} className="">
            <h2 id="inner">内层</h2>
          </Dialog>
        </Dialog>
      </AnimatePresence>,
    ),
  ).toThrow('AnimatePresence')
  vi.restoreAllMocks()
})
