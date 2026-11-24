import { isUnfinished, type TaskView } from '../../shared/bridge'
import { latestVersion, type MiniApp } from '../../shared/miniApp'
import { dateLabel } from '../chat/chatMessages'
import { Icon } from '../ui/Icon'
import { useNow } from '../ui/useNow'
import type { Run } from './miniAppRuns'
import { MiniAppThumb } from './MiniAppThumb'
import { MiniAppTile } from './MiniAppTile'
import { runStatus } from './runStatus'
import { strings } from '../../shared/strings'

const MAKE_TEXT = strings().miniApp.tab.makeStarter
const STATUS_REFRESH_MS = 15_000

interface Props {
  miniApps: MiniApp[]
  runs: Run[] // of this bot's mini apps that have been opened
  tasks: TaskView[] // its recent tasks: an unfinished one with a mini app is changing it
  thumbUrl: (app: MiniApp) => string
  onOpen: (miniAppId: string, from: Element) => void
  onFill: (text: string) => void // puts a message in the box for the user to finish and send
}

/** The panel's 小程序 tab: the bot's mini apps as cards showing what each looks like now, its version and how it is doing. */
export function MiniAppsTab({ miniApps, runs, tasks, thumbUrl, onOpen, onFill }: Props) {
  const words = strings().miniApp.tab
  const now = useNow(STATUS_REFRESH_MS)
  return (
    <>
      <p className="pt-3.5 pb-2.5 text-sm text-muted">{words.intro}</p>
      {miniApps.length > 0 && (
        <ul aria-label={words.list} className="grid grid-cols-2 gap-2.5">
          {miniApps.map((app) => {
            const latest = latestVersion(app)
            const run = runs.find((candidate) => candidate.miniAppId === app.id)
            const status = run && runStatus(run, latest.version, now)
            const isEditing = tasks.some((task) => isUnfinished(task) && task.miniAppId === app.id)
            return (
              <li
                key={app.id}
                className="relative overflow-hidden rounded-lg bg-surface shadow-ring has-[button:active]:scale-97"
              >
                <MiniAppThumb src={thumbUrl(app)} height={100} />
                <button
                  type="button"
                  onClick={(event) => onOpen(app.id, event.currentTarget)}
                  className="flex w-full flex-col gap-0.5 border-t border-line px-2.5 pt-2 pb-2.5 text-left after:absolute after:inset-0 active:scale-none"
                >
                  <span className="flex items-center gap-1.5">
                    <MiniAppTile app={app} size={20} />
                    <span className="min-w-0 flex-1 truncate text-md font-semibold">{app.name}</span>
                    <span className="shrink-0 rounded-sm bg-bubble px-1 text-xs font-semibold text-soft tabular-nums">
                      v{latest.version}
                    </span>
                  </span>
                  <small
                    data-status={isEditing ? 'editing' : status?.kind}
                    className="truncate text-xs text-muted data-[status=editing]:text-accent data-[status=update]:text-accent"
                  >
                    {isEditing
                      ? words.changing
                      : (status?.text ?? words.updated(dateLabel(Math.max(app.dataAt ?? 0, latest.at))))}
                  </small>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={() => onFill(MAKE_TEXT)}
        className="mt-2.5 flex w-full items-center gap-3 rounded-lg p-3 text-left leading-[1.35] text-soft shadow-ring"
      >
        <Icon name="plus" size={20} />
        <span className="flex flex-col">
          <span className="text-md">{words.make}</span>
          <small className="text-sm text-muted">{words.makeHint}</small>
        </span>
      </button>
    </>
  )
}
