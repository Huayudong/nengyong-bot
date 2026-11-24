import { expect, it } from 'vitest'
import { activityLabel } from './activityLabel'

it('follows the activity wording rules', () => {
  expect(activityLabel(null, 0)).toBe('着手处理')
  expect(activityLabel({ kind: 'thinking' }, 0.99)).toBe('在打腹稿')
  expect(activityLabel({ kind: 'typing' }, 0)).toBe('在打字…')
  expect(activityLabel({ kind: 'tool', tool: 'start_task' }, 0)).toBe('正在安排任务')
  expect(activityLabel({ kind: 'tool', tool: 'remember' }, 0)).toBe('记到小本本上')
  expect(activityLabel({ kind: 'tool', tool: 'unknown_tool' }, 0.5)).toBe('一步一步来')
})
