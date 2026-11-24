export const RUNNING_AFTER_MINIMIZE_MS = 5 * 60_000 // a minimized mini app keeps taking new data this long, then suspends
export const KEPT_AFTER_CLOSE_MS = 30 * 60_000 // a closed one stays suspended this long, then is destroyed
export const DOCK_MAX = 5

/** Where on screen a window grows out of or shrinks into: the card clicked, the dock. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** A mini app opened since the app started: its window is in front, minimized to the dock, or closed and kept a while. */
export interface Run {
  botId: string
  miniAppId: string
  status: 'front' | 'docked' | 'closed'
  leftAt: number // when it last left the front
  startedAt: number // when its page last loaded from scratch: a cold start, or 重新进入
  seenVersion: number // the newest version its window has loaded; a newer one is an update
  preview: number | null // an older version shown instead of the latest, until restored or left
  origin: Rect | null // what it grew out of when it last opened, or shrank into when it left
}

/** All runs, in the order they were first opened; dock: the minimized ones, the latest first. */
export interface Runs {
  runs: Run[]
  dock: string[] // run keys
}

export type Phase = 'front' | 'running' | 'suspended' | 'destroyed'

export type RunEvent =
  | { kind: 'open'; botId: string; miniAppId: string; at: number; origin: Rect | null }
  | { kind: 'minimize'; key: string; at: number; origin: Rect | null }
  | { kind: 'close'; key: string; at: number }
  | { kind: 'restart'; key: string; at: number }
  | { kind: 'loaded'; key: string; version: number }
  | { kind: 'preview'; key: string; version: number | null }
  | { kind: 'forget'; botId: string; miniAppId: string } // deleted: its window goes at once

export const EMPTY_RUNS: Runs = { runs: [], dock: [] }

export const runKey = (run: Pick<Run, 'botId' | 'miniAppId'>) => `${run.botId}/${run.miniAppId}`

export function rectOf(element: Element): Rect {
  const { x, y, width, height } = element.getBoundingClientRect()
  return { x, y, width, height }
}

/** Front; minimized and still running; suspended (minimized a while, or closed); or destroyed: the next open starts it again. */
export function phaseOf(run: Run, now: number): Phase {
  const idle = now - run.leftAt
  switch (run.status) {
    case 'front':
      return 'front'
    case 'docked':
      return idle < RUNNING_AFTER_MINIMIZE_MS ? 'running' : 'suspended'
    case 'closed':
      return idle < KEPT_AFTER_CLOSE_MS ? 'suspended' : 'destroyed'
    default:
      return run.status satisfies never
  }
}

/** The window lifecycle: one in front at a time, up to DOCK_MAX minimized, closed ones kept until destroyed. */
export function miniAppRuns(state: Runs, event: RunEvent): Runs {
  switch (event.kind) {
    case 'open': {
      const key = runKey(event)
      const known = state.runs.find((run) => runKey(run) === key)
      const front = state.runs.find((run) => run.status === 'front' && runKey(run) !== key)
      const isCold = !known || phaseOf(known, event.at) === 'destroyed'
      const opened: Run = {
        botId: event.botId,
        miniAppId: event.miniAppId,
        status: 'front',
        leftAt: event.at,
        startedAt: isCold ? event.at : (known?.startedAt ?? event.at),
        seenVersion: isCold ? 0 : (known?.seenVersion ?? 0),
        preview: null,
        origin: event.origin,
      }
      // opening another one minimizes the one in front: it is not lost
      const runs = state.runs.map((run) => {
        if (runKey(run) === key) return opened
        return run === front ? { ...run, status: 'docked' as const, leftAt: event.at, origin: null } : run
      })
      const dock = [...(front ? [runKey(front)] : []), ...state.dock.filter((each) => each !== key)]
      // the order stays as it was: a frame moved in the DOM reloads its page, losing where the user was in it
      return fitDock({ runs: known ? runs : [...runs, opened], dock }, event.at)
    }
    case 'minimize':
      return fitDock(
        {
          runs: change(state.runs, event.key, {
            status: 'docked',
            leftAt: event.at,
            origin: event.origin,
            preview: null,
          }),
          dock: [event.key, ...state.dock.filter((each) => each !== event.key)],
        },
        event.at,
      )
    case 'close':
      return {
        runs: change(state.runs, event.key, { status: 'closed', leftAt: event.at, preview: null }),
        dock: state.dock.filter((each) => each !== event.key),
      }
    case 'restart':
      return { ...state, runs: change(state.runs, event.key, { startedAt: event.at, seenVersion: 0, preview: null }) }
    case 'loaded': {
      const run = state.runs.find((each) => runKey(each) === event.key)
      if (!run || event.version <= run.seenVersion) return state
      return { ...state, runs: change(state.runs, event.key, { seenVersion: event.version }) }
    }
    case 'preview':
      return { ...state, runs: change(state.runs, event.key, { preview: event.version }) }
    case 'forget': {
      const key = runKey(event)
      return { runs: state.runs.filter((run) => runKey(run) !== key), dock: state.dock.filter((each) => each !== key) }
    }
    default:
      return event satisfies never
  }
}

function change(runs: Run[], key: string, changes: Partial<Run>): Run[] {
  return runs.map((run) => (runKey(run) === key ? { ...run, ...changes } : run))
}

// past DOCK_MAX, the oldest minimized one is closed: still kept a while, so it can come back
function fitDock(state: Runs, at: number): Runs {
  const dropped = state.dock.slice(DOCK_MAX)
  if (!dropped.length) return state
  return {
    runs: state.runs.map((run) =>
      dropped.includes(runKey(run)) ? { ...run, status: 'closed' as const, leftAt: at, origin: null } : run,
    ),
    dock: state.dock.slice(0, DOCK_MAX),
  }
}
