import { z } from 'zod'
import type { HarnessEvent } from '../shared/bridge'
import type { Flow } from '../shared/flow'
import type { Store } from './store'

const MAX_FLOW_CHARS = 20_000 // all of a bot's flows together: they go into every system prompt of its chat

// models often fill an optional id with "": that means none, never a flow whose id is empty
export const OptionalId = z.preprocess((value) => (value === '' ? undefined : value), z.string().optional())

const line = (max: number) => z.string().trim().min(1).max(max)

export const NewFlow = z.object({
  id: OptionalId.describe('改已有的流程时填它的 id，整条替换；新建不填'),
  name: line(40).describe('显示在面板上的短名字，如“发版说明整理”'),
  when: line(200).describe('什么时候用：用户会怎么说、遇到什么情况'),
  steps: z.array(line(300)).min(1).max(20).describe('按顺序的步骤，每步一句：做什么、用什么'),
  notes: z
    .array(line(300))
    .max(10)
    .describe('注意事项：用户提过的要求和纠正，如“贴到 Release 之前先给我看”；没有就传 []，改写时原有的也要写上'),
})

export function updateFlows(
  store: Store,
  emit: (event: HarnessEvent) => void,
  botId: string,
  change: (flows: Flow[]) => Flow[],
) {
  const bot = store.get().bots[botId]
  if (!bot) throw new Error(`未知的 Bot：${botId}`)
  const flows = change(bot.flows)
  const chars = charsOf(flows)
  // a change that shrinks them is always let through, so going over never locks the flows in
  if (chars > MAX_FLOW_CHARS && chars > charsOf(bot.flows))
    throw new Error(`流程加起来超过 ${MAX_FLOW_CHARS} 字（它们每轮都写进系统提示词），先精简或删掉不用的`)
  store.updateBot(botId, { flows })
  emit({ kind: 'flows', botId, flows })
}

const charsOf = (flows: Flow[]) =>
  flows.flatMap((flow) => [flow.name, flow.when, ...flow.steps, ...flow.notes]).join('').length

/** Throws a readable reason unless the bot has this flow. */
export function checkFlow(store: Store, botId: string, flowId: string) {
  if (!store.get().bots[botId]?.flows.some((flow) => flow.id === flowId)) throw new Error(`没有 id 为 ${flowId} 的流程`)
}
