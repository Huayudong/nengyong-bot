import type { Entry } from './bridge'
import { FlowSaved } from './flow'
import { strings } from './strings'

/** How much the user trusts one bot, read from its chat: what the island's level, ring and stats show. */
export interface Trust {
  level: number // 1..MAX_LEVEL
  points: number // earned inside the current level
  needed: number // for the next level; 0 at MAX_LEVEL
  messages: number // the user's messages to this bot
  flowsSaved: number // flows it saved new
  flowRuns: number // tasks that followed one of its flows and came back done
}

export const MAX_LEVEL = 99
export const MESSAGES_PER_POINT = 5
export const POINTS_PER_FLOW_SAVED = 30
export const POINTS_PER_FIRST_FLOW_RUN = 50 // the first time a flow comes back done
export const POINTS_PER_FLOW_RUN = 10
export const POINTS_PER_LEVEL = 5 // level n takes n times this to the next

// a name is a getter: read when it is shown, in the language of that moment
export const TIERS = [
  {
    from: 1,
    get name() {
      return strings().common.tiers.new
    },
    color: '#8a8a8a',
  },
  {
    from: 10,
    get name() {
      return strings().common.tiers.familiar
    },
    color: '#2bc48a',
  },
  {
    from: 30,
    get name() {
      return strings().common.tiers.inSync
    },
    color: '#4a8cff',
  },
  {
    from: 60,
    get name() {
      return strings().common.tiers.trusted
    },
    color: '#7b5cf5',
  },
  {
    from: 90,
    get name() {
      return strings().common.tiers.confidant
    },
    color: '#ff8a1f',
  },
  {
    from: MAX_LEVEL,
    get name() {
      return strings().common.tiers.maxed
    },
    color: '#f0468c',
  },
] as const

export function trustOf(entries: Entry[]): Trust {
  const { total, ...counts } = tallyOf(entries)
  return { ...levelOf(total), ...counts }
}

/** What one new entry earns its bot, given the entries before it. */
export const pointsOf = (entry: Entry, before: Entry[]) => tallyOf([...before, entry]).total - tallyOf(before).total

const SHINE_FROM_LEVEL = 60

/** How a level shows off on its badge and on the bot's staff badge: a light band sweeping across from Lv.60, every hue at the top. */
export function levelEffectOf(level: number): 'shine' | 'rainbow' | undefined {
  if (level === MAX_LEVEL) return 'rainbow'
  if (level >= SHINE_FROM_LEVEL) return 'shine'
  return undefined
}

export const tierOf = (level: number) => TIERS[TIERS.findLastIndex((tier) => level >= tier.from)] ?? TIERS[0]

export const pointsToNext = (level: number) => level * POINTS_PER_LEVEL

export const pointsToReach = (level: number) => (POINTS_PER_LEVEL * level * (level - 1)) / 2

const isFlowSaved = (entry: Entry) =>
  entry.kind === 'tool' && entry.name === 'save_flow' && FlowSaved.safeParse(entry.output).data?.isNew === true

const flowIdOfRun = (entry: Entry) =>
  entry.kind === 'task-result' && entry.status === 'done' && entry.flowId !== undefined ? [entry.flowId] : []

function tallyOf(entries: Entry[]) {
  const messages = entries.filter((entry) => entry.kind === 'user').length
  const flowsSaved = entries.filter(isFlowSaved).length
  const runs = entries.flatMap(flowIdOfRun)
  const firstRuns = new Set(runs).size
  const total =
    Math.floor(messages / MESSAGES_PER_POINT) +
    flowsSaved * POINTS_PER_FLOW_SAVED +
    firstRuns * POINTS_PER_FIRST_FLOW_RUN +
    (runs.length - firstRuns) * POINTS_PER_FLOW_RUN
  return { total, messages, flowsSaved, flowRuns: runs.length }
}

function levelOf(total: number): Pick<Trust, 'level' | 'points' | 'needed'> {
  let level = 1
  let points = total
  while (level < MAX_LEVEL && points >= pointsToNext(level)) {
    points -= pointsToNext(level)
    level += 1
  }
  return level === MAX_LEVEL ? { level, points: 0, needed: 0 } : { level, points, needed: pointsToNext(level) }
}
