import { encode } from 'uqr'

const QUIET_MODULES = 2 // the blank margin a camera needs around the code to find it

/** `text` as a QR code a phone camera reads: dark on white in either theme, the way scanners expect it. */
export function QrCode({ text, size, label }: { text: string; size: number; label: string }) {
  const { data } = encode(text)
  const modules = data.length + QUIET_MODULES * 2
  const path = data
    .flatMap((row, y) =>
      row.flatMap((isDark, x) => (isDark ? [`M${x + QUIET_MODULES} ${y + QUIET_MODULES}h1v1h-1z`] : [])),
    )
    .join('')
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${modules} ${modules}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="shrink-0 rounded-md bg-white"
    >
      <path d={path} className="fill-black" />
    </svg>
  )
}
