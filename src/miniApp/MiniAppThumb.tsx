import { useRef } from 'react'
import { useElementSize } from '../ui/useElementSize'

const PAGE_WIDTH = 375 // the phone width mini app pages are written for

/** A mini app's page shrunk to fit: live but untouchable, loaded only once it scrolls into view. */
export function MiniAppThumb({ src, height }: { src: string; height: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const scale = (useElementSize(ref)?.width ?? PAGE_WIDTH) / PAGE_WIDTH
  return (
    <span
      ref={ref}
      aria-hidden
      className="pointer-events-none relative block overflow-hidden bg-canvas"
      style={{ height }}
    >
      <iframe
        title=""
        src={src}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        loading="lazy"
        tabIndex={-1}
        inert
        className="origin-top-left"
        style={{ width: PAGE_WIDTH, height: height / scale, transform: `scale(${scale})` }}
      />
      <span className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-surface/0 to-surface" />
    </span>
  )
}
