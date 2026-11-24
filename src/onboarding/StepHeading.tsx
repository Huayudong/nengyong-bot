/** The title of an onboarding step, centred across the stage `top` px from its top edge. */
export function StepHeading({ top, title, sub }: { top: number; title: string; sub?: string }) {
  return (
    <div className="absolute inset-x-0 text-center" style={{ top }}>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mx-auto mt-1.5 max-w-[520px] text-soft">{sub}</p>}
    </div>
  )
}
