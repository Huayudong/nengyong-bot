import type { ReactNode } from 'react'

/** The white box the panel groups its rows in. */
export const PanelCard = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-lg bg-surface shadow-ring ${className}`}>{children}</div>
)

export const PanelEmpty = ({ children }: { children: ReactNode }) => (
  <p className="py-10 text-center text-sm text-muted">{children}</p>
)

export const PanelSectionTitle = ({ children }: { children: ReactNode }) => (
  <h5 className="pt-[18px] pb-2 text-md text-soft">{children}</h5>
)
