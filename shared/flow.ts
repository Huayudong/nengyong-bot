import { z } from 'zod'
import { ModelChoice } from './modelServices'

/** A way of working a bot saved to follow again: when to use it, its steps in order, and what to watch out for. */
export const Flow = z.object({
  id: z.string(),
  name: z.string(),
  when: z.string(),
  steps: z.array(z.string()),
  notes: z.array(z.string()), // the user's requirements and corrections
  updatedAt: z.number(),
  model: ModelChoice.optional().catch(undefined), // tasks by it run on this model unless they name their own; absent: the main model
})
export type Flow = z.infer<typeof Flow>

/** What the save_flow tool returns, as its tool entry records it. */
export const FlowSaved = z.object({ saved: z.string(), isNew: z.boolean(), mention: z.string() })
export type FlowSaved = z.infer<typeof FlowSaved>
