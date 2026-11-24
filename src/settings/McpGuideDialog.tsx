import { Dialog } from '../ui/Dialog'
import { strings } from '../../shared/strings'

const LOCAL_EXAMPLE = `"playwright": {
  "command": "npx",
  "args": ["@playwright/mcp@latest"]
}`

const REMOTE_EXAMPLE = `"my-remote": {
  "url": "https://…/mcp",
  "headers": { "Authorization": "Bearer …" }
}`

/** How to fill in the MCP config, opened from the question mark on the tools page. */
export function McpGuideDialog({ onClose }: { onClose: () => void }) {
  const words = strings().settings.mcpGuide
  return (
    <Dialog labelledBy="mcp-guide-title" onClose={onClose} className="w-[440px] rounded-xl bg-surface p-5">
      <h2 id="mcp-guide-title" className="text-lg font-semibold">
        {words.title}
      </h2>
      <p className="mt-2 text-md leading-relaxed text-soft">{words.intro}</p>
      <Example title={words.browserExample} code={LOCAL_EXAMPLE} />
      <Example title={words.remoteExample} code={REMOTE_EXAMPLE} />
      <div className="mt-5 flex justify-end">
        <button type="button" autoFocus onClick={onClose} className="h-9 rounded-full bg-bubble px-4 text-md">
          {words.gotIt}
        </button>
      </div>
    </Dialog>
  )
}

function Example({ title, code }: { title: string; code: string }) {
  return (
    <section className="mt-4">
      <h3 className="mb-1.5 text-sm text-muted">{title}</h3>
      <pre className="overflow-x-auto rounded-lg bg-bubble px-3.5 py-3 font-mono text-xs leading-relaxed">{code}</pre>
    </section>
  )
}
