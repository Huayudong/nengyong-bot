import { latestVersion, type MiniApp } from '../../shared/miniApp'
import { MiniAppTile } from './MiniAppTile'
import { strings } from '../../shared/strings'

/** Above the message box while a mini app of this bot is open: a message sent now tells the bot it is about that one. */
export function ViewingMiniApp({ app }: { app: MiniApp }) {
  const words = strings().miniApp.viewing
  return (
    <div className="m-1 flex items-center gap-1.5 rounded-2xl bg-bubble py-1 pr-3 pl-1.5 text-sm text-soft">
      <MiniAppTile app={app} size={18} />
      <span className="shrink-0">
        {words.label} <b className="font-semibold text-ink">{app.name}</b> v{latestVersion(app).version}
      </span>
      <span className="min-w-0 truncate text-muted">{words.hint}</span>
    </div>
  )
}
