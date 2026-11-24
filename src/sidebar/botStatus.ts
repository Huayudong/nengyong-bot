import { isUnfinished, type RoutineView, type TaskView } from '../../shared/bridge'
import { locale } from '../../shared/language'
import { calendarDay, clockLabel, TIMEZONE } from '../../shared/timezone'
import { activityLabel } from '../activityLabel'
import { elapsedLabel } from '../elapsedLabel'
import type { Thread } from '../harnessState'
import { strings } from '../../shared/strings'

/** What a bot is up to, as the sidebar shows it: one thing at a time, the first of these that holds. */
export type BotStatus =
  | { kind: 'failed'; task: TaskView } // its last task failed after the user last looked at its chat
  | { kind: 'replying'; label: string; since: number }
  | { kind: 'working'; task: TaskView; count: number } // count: its unfinished tasks, this one included
  | { kind: 'waiting'; task: TaskView }
  | { kind: 'idle' }

/** The open bot's failures are not flagged: the user is looking at its chat. */
export function botStatusOf(thread: Thread, seenAt: number, isOpen: boolean): BotStatus {
  const { tasks } = thread.panel
  const last = tasks.reduce<TaskView | undefined>(
    (latest, task) => ((task.endedAt ?? 0) > (latest?.endedAt ?? 0) ? task : latest),
    undefined,
  )
  if (!isOpen && last?.status === 'failed' && (last.endedAt ?? 0) > seenAt) return { kind: 'failed', task: last }
  if (thread.progress) {
    const { activity, draw, since } = thread.progress
    return { kind: 'replying', label: activityLabel(activity, draw), since }
  }
  const unfinished = tasks.filter(isUnfinished)
  const running = unfinished.find((task) => task.status === 'running')
  if (running) return { kind: 'working', task: running, count: unfinished.length }
  const [waiting] = unfinished
  return waiting ? { kind: 'waiting', task: waiting } : { kind: 'idle' }
}

/** The disc on the avatar: replying and running a task are both work. Nothing while idle. */
export type DotKind = 'busy' | 'waiting' | 'failed'

export const DOT_LABELS: Record<DotKind, string> = {
  busy: strings().sidebar.status.busy,
  waiting: strings().common.taskStatus.waiting,
  failed: strings().sidebar.status.failed,
}

export function dotKindOf(status: BotStatus): DotKind | null {
  switch (status.kind) {
    case 'replying':
    case 'working':
      return 'busy'
    case 'waiting':
    case 'failed':
      return status.kind
    case 'idle':
      return null
    default:
      return status satisfies never
  }
}

/** The line under the bot's name in place of its last reply; null while idle, when the last reply stays. */
export function statusLineOf(status: BotStatus, now: number): string | null {
  switch (status.kind) {
    case 'failed':
      return strings().sidebar.status.failedTask(status.task.title, whenLabel(status.task.endedAt ?? now, now))
    case 'replying':
      return `${status.label} ${elapsedLabel(now - status.since)}`.trim()
    case 'working': {
      const elapsed = elapsedLabel(now - status.task.createdAt)
      if (status.count === 1) return strings().sidebar.status.running(status.task.title, elapsed).trim()
      return strings().sidebar.status.runningMany(status.task.title, status.count, elapsed).trim()
    }
    case 'waiting':
      return strings().sidebar.status.queued(status.task.title, strings().common.taskStatus.waiting)
    case 'idle':
      return null
    default:
      return status satisfies never
  }
}

/** The routine that runs next, if any is going to. */
export function nextRoutineOf(routines: RoutineView[]): (RoutineView & { nextRunAt: number }) | undefined {
  return routines.reduce<(RoutineView & { nextRunAt: number }) | undefined>((soonest, routine) => {
    const { nextRunAt } = routine
    if (nextRunAt === null) return soonest
    return soonest && soonest.nextRunAt <= nextRunAt ? soonest : { ...routine, nextRunAt }
  }, undefined)
}

/** 8:05 today, 昨天 / 明天 8:05 a day off, the date further away. */
export function whenLabel(at: number, now: number): string {
  const days = calendarDay(at) - calendarDay(now)
  if (days === 0) return clockLabel(at)
  if (days === 1) return strings().app.time.tomorrow(clockLabel(at))
  if (days === -1) return strings().app.time.yesterday(clockLabel(at))
  return new Date(at).toLocaleDateString(locale(), { timeZone: TIMEZONE, month: 'long', day: 'numeric' })
}
