import type { ReactNode } from 'react'

/** Raw text from the run, as the model saw or wrote it: monospace, wrapped, scrolling past a few lines. */
export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="max-h-[150px] overflow-auto rounded-md bg-white/10 px-2.5 py-2 font-mono text-xs break-all whitespace-pre-wrap text-white/60">
      {children}
    </pre>
  )
}
