/** A model's colour on the 用量 chart; a model with no price is drawn nowhere and gets a dashed ring. */
export function ModelSwatch({ color }: { color: string | undefined }) {
  if (!color) return <span className="inline-block size-2 shrink-0 rounded-full border border-dashed border-muted" />
  return <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: color }} />
}
