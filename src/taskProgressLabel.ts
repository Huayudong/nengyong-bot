import { type TaskView } from '../shared/bridge'
import { elapsedLabel } from './elapsedLabel'
import { strings } from '../shared/strings'

/** What an unfinished task is doing: its own status line (or "运行中") and how long it has run, or "排队中". */
export function taskProgressLabel(task: TaskView, now: number): string {
  if (task.status === 'waiting') return strings().common.taskStatus.waiting
  return `${task.statusText || strings().common.taskStatus.running} ${elapsedLabel(now - task.createdAt)}`.trim()
}
