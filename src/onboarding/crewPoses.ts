import { type Bot, MAIN_BOT_ID, secretary } from '../../shared/bot'
import type { BotActivity } from '../bot/botActivity'
import { DEMO_TEAM, type Hire } from './identities'

export type Step = 'meet' | 'team' | 'background' | 'model' | 'identity' | 'handoff'
export type MeetPhase = 'name' | 'address' | 'done'
export type Move = 'instant' | 'hop' | 'glide' | 'fly'

/** Where one bot of the crew stands, in px from the centre of the stage, and how it gets there. */
export interface Pose {
  bot: Bot
  x: number
  y: number
  scale: number
  opacity: number
  move: Move
  delay?: number // s
  mood?: BotActivity
}

interface Scene {
  step: Step
  beat: number
  boss: Bot
  meetPhase: MeetPhase
  candidates: Hire[] // the hires the picked identity offers
  hires: Hire[] // the candidates kept
  targets: Record<string, Spot> // measured sidebar avatars, by crew bot id
}

export interface Spot {
  x: number
  y: number
  scale: number
}

export const CREW_SIZE = 100
export const DROP_PX = 48 // how far a bot falls onto the spot it turns up at
export const CANDIDATE_Y = -30
export const candidateX = (index: number) => (index - 2) * 136
export const TEAM_SPOTS: Record<string, Spot> = {
  'demo-analyst': { x: -190, y: -40, scale: 0.85 },
  'demo-secretary': { x: 0, y: -20, scale: 0.85 },
  'demo-researcher': { x: 190, y: -40, scale: 0.85 },
}

const GREETING_SPOT = { x: 0, y: -120, scale: 1.05 }
const TEAM_LEAD_SPOT = { x: 0, y: -185, scale: 0.6 }
// the stage's bottom edge; a bot's feet are 45% of its box below its centre
const FLOOR_Y = 280
const standing = (x: number, scale: number): Spot => ({ x, y: FLOOR_Y - 45 * scale, scale })
const BENCH: Record<string, Spot> = {
  [MAIN_BOT_ID]: standing(-280, 0.5),
  'demo-secretary': standing(-336, 0.42),
  'demo-analyst': standing(280, 0.42),
  'demo-researcher': standing(336, 0.42),
}
const ROW_GAP = 116
const ANALYST_MOOD_BY_BEAT: Record<number, BotActivity> = { 3: 'thinking', 4: 'happy' }

/** Every bot on stage for this moment: one that turns up drops in, one left out walks off. */
export function crewPoses(scene: Scene): Pose[] {
  const { step, beat, boss } = scene
  switch (step) {
    case 'meet':
      if (beat === 0) return [lifted(boss, GREETING_SPOT)]
      return [
        {
          bot: boss,
          ...GREETING_SPOT,
          opacity: 1,
          move: 'hop',
          mood: scene.meetPhase === 'done' ? 'happy' : undefined,
        },
      ]
    case 'team':
      return [
        { bot: boss, ...TEAM_LEAD_SPOT, opacity: 1, move: 'glide' },
        ...DEMO_TEAM.map((bot, index) => teamPose(bot, index, beat)),
      ]
    case 'background':
      return [boss, ...DEMO_TEAM].map((bot) => ({
        ...waiting(bot),
        mood: bot.id === 'demo-analyst' ? ANALYST_MOOD_BY_BEAT[beat] : undefined,
      }))
    case 'model':
      return [boss, ...DEMO_TEAM].map(waiting)
    case 'identity':
      return [waiting(boss), ...scene.candidates.map((bot, index) => candidatePose(bot, index, scene.hires))]
    case 'handoff':
      return [boss, secretary(), ...scene.hires].map((bot, index, row) => handoffPose(bot, index, row.length, scene))
    default:
      return step satisfies never
  }
}

/** Out of sight just above its spot, so that the next pose drops it in. */
const lifted = (bot: Bot, spot: Spot): Pose => ({ bot, ...spot, y: spot.y - DROP_PX, opacity: 0, move: 'instant' })

function teamPose(bot: Hire, index: number, beat: number): Pose {
  const spot = TEAM_SPOTS[bot.id] ?? GREETING_SPOT
  if (beat === 0) return lifted(bot, spot)
  return {
    bot,
    ...spot,
    opacity: 1,
    move: 'hop',
    delay: beat === 1 ? index * 0.09 : 0,
    mood: bot.id === 'demo-analyst' && beat >= 2 ? 'happy' : undefined,
  }
}

/** Standing on the floor beside the step's buttons while the step has the stage. */
const waiting = (bot: Bot): Pose => ({ bot, ...(BENCH[bot.id] ?? standing(0, 0.4)), opacity: 1, move: 'glide' })

function candidatePose(bot: Hire, index: number, hires: Hire[]): Pose {
  return {
    bot,
    x: candidateX(index),
    y: CANDIDATE_Y,
    scale: 0.6,
    opacity: hires.includes(bot) ? 1 : 0.35,
    move: 'hop',
    delay: index * 0.05,
  }
}

/** The boss and the newcomers line up, fly to their sidebar avatars, then give way to them. */
function handoffPose(bot: Bot, index: number, count: number, { beat, targets }: Scene): Pose {
  const row = { x: (index - (count - 1) / 2) * ROW_GAP, y: -60 }
  const target = targets[bot.id]
  if (beat === 0)
    return {
      bot,
      ...row,
      scale: index === 0 ? 0.8 : 0.66,
      opacity: 1,
      move: 'hop',
      delay: index * 0.06,
      mood: 'happy',
    }
  if (beat === 1 && target) return { bot, ...target, opacity: 1, move: 'fly', delay: index * 0.05 }
  if (beat === 1) return { bot, ...row, scale: 0.66, opacity: 1, move: 'glide' }
  return { bot, ...(target ?? { ...row, scale: 0.66 }), opacity: 0, move: 'instant' }
}
