import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useStickToBottom } from './useStickToBottom'

let resized = () => {}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn(function resizeObserver(callback: () => void) {
      resized = callback
      return { observe() {}, unobserve() {}, disconnect() {} }
    }),
  )
})
afterEach(cleanup)

function Scroller({ chat }: { chat: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useStickToBottom(ref, chat)
  return (
    <div ref={ref} data-testid="scroller">
      <div />
    </div>
  )
}

// jsdom lays nothing out: give the scroller a 100px window onto `contentHeight` of content, then report that first
// layout the way a real ResizeObserver does once it starts observing
function layOut(element: HTMLElement, contentHeight: { value: number }) {
  Object.defineProperty(element, 'clientHeight', { value: 100 })
  Object.defineProperty(element, 'scrollHeight', { get: () => contentHeight.value })
  act(() => resized())
}

it('follows growing content while scrolled to the bottom', () => {
  const contentHeight = { value: 300 }
  render(<Scroller chat="a" />)
  const scroller = screen.getByTestId('scroller')
  layOut(scroller, contentHeight)
  contentHeight.value = 500
  act(() => resized())
  expect(scroller.scrollTop).toBe(500)
})

it('stays where the user scrolled up to when content grows', () => {
  const contentHeight = { value: 300 }
  render(<Scroller chat="a" />)
  const scroller = screen.getByTestId('scroller')
  layOut(scroller, contentHeight)
  scroller.scrollTop = 50
  fireEvent.scroll(scroller)
  contentHeight.value = 500
  act(() => resized())
  expect(scroller.scrollTop).toBe(50)
})

it('keeps following when content grows again before its own scroll is reported', () => {
  const contentHeight = { value: 300 }
  render(<Scroller chat="a" />)
  const scroller = screen.getByTestId('scroller')
  layOut(scroller, contentHeight)
  contentHeight.value = 500
  act(() => resized())
  contentHeight.value = 700
  fireEvent.scroll(scroller)
  act(() => resized())
  expect(scroller.scrollTop).toBe(700)
})

it('keeps following after sending when the sent message shows up before the scroll is reported', () => {
  const contentHeight = { value: 300 }
  let stick = () => {}
  function Sender() {
    const ref = useRef<HTMLDivElement>(null)
    stick = useStickToBottom(ref, 'a').stick
    return (
      <div ref={ref} data-testid="scroller">
        <div />
      </div>
    )
  }
  render(<Sender />)
  const scroller = screen.getByTestId('scroller')
  layOut(scroller, contentHeight)
  scroller.scrollTop = 50
  fireEvent.scroll(scroller)
  act(() => stick())
  contentHeight.value = 500
  fireEvent.scroll(scroller)
  act(() => resized())
  expect(scroller.scrollTop).toBe(500)
})

it('starts at the bottom again when another chat opens', () => {
  const contentHeight = { value: 300 }
  const { rerender } = render(<Scroller chat="a" />)
  const scroller = screen.getByTestId('scroller')
  layOut(scroller, contentHeight)
  scroller.scrollTop = 50
  fireEvent.scroll(scroller)
  rerender(<Scroller chat="b" />)
  expect(scroller.scrollTop).toBe(300)
})

it('opens the next chat where it was asked to, and stays there when content grows', () => {
  const contentHeight = { value: 300 }
  let startNextAt = (_top: number) => {}
  function Returner({ chat }: { chat: string }) {
    const ref = useRef<HTMLDivElement>(null)
    startNextAt = useStickToBottom(ref, chat).startNextAt
    return (
      <div ref={ref} data-testid="scroller">
        <div />
      </div>
    )
  }
  const { rerender } = render(<Returner chat="a" />)
  const scroller = screen.getByTestId('scroller')
  layOut(scroller, contentHeight)
  startNextAt(80)
  rerender(<Returner chat="b" />)
  expect(scroller.scrollTop).toBe(80)
  contentHeight.value = 500
  act(() => resized())
  expect(scroller.scrollTop).toBe(80)
  rerender(<Returner chat="c" />)
  expect(scroller.scrollTop).toBe(500)
})
