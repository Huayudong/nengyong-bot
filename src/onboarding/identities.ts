import { MAIN_BOT, PALETTE, type Shape } from '../../shared/bot'
import { strings } from '../../shared/strings'

type ColorId = (typeof PALETTE)[number]['id']

/** A bot the onboarding offers to hire; `id` names it in the catalog, the harness gives the real one. */
export interface Hire {
  id: string
  name: string
  shape: Shape
  color: string
  duty: string
}

export interface Identity {
  id: string
  label: string
  tries: string[] // what the main bot suggests trying first
  hires: Hire[]
}

const words = strings().identities
const colorOf = (id: ColorId) => PALETTE.find((color) => color.id === id)?.value ?? MAIN_BOT.color
const hire = (id: keyof typeof words.hires, shape: Shape, color: ColorId): Hire => ({
  id,
  ...words.hires[id],
  shape,
  color: colorOf(color),
})

export const IDENTITIES: Identity[] = [
  {
    id: 'dev',
    ...words.roles.dev,
    hires: [
      hire('dev-review', 'octagon', 'sky'),
      hire('dev-research', 'pudding', 'grape'),
      hire('dev-debug', 'sun', 'coral'),
      hire('dev-release', 'onigiri', 'mint'),
      hire('dev-oss', 'cloud', 'slate'),
    ],
  },
  {
    id: 'pm',
    ...words.roles.pm,
    hires: [
      hire('pm-competitor', 'cloud', 'grape'),
      hire('pm-feedback', 'drop', 'rose'),
      hire('pm-prd', 'mushroom', 'sky'),
      hire('pm-interview', 'bell', 'tangerine'),
      hire('pm-metrics', 'pudding', 'mint'),
    ],
  },
  {
    id: 'design',
    ...words.roles.design,
    hires: [
      hire('design-inspiration', 'clover', 'rose'),
      hire('design-review', 'octagon', 'grape'),
      hire('design-copy', 'bell', 'lake'),
      hire('design-watch', 'cloud', 'tangerine'),
      hire('design-assets', 'cat', 'cocoa'),
    ],
  },
  {
    id: 'qa',
    ...words.roles.qa,
    hires: [
      hire('qa-cases', 'mushroom', 'mint'),
      hire('qa-regression', 'octagon', 'sky'),
      hire('qa-bugs', 'sun', 'coral'),
      hire('qa-daily', 'pudding', 'slate'),
      hire('qa-edge', 'diamond', 'lemon'),
    ],
  },
  {
    id: 'ops',
    ...words.roles.ops,
    hires: [
      hire('ops-topics', 'bell', 'tangerine'),
      hire('ops-trends', 'sun', 'lake'),
      hire('ops-writer', 'drop', 'rose'),
      hire('ops-review', 'clover', 'mint'),
      hire('ops-users', 'cat', 'lemon'),
    ],
  },
  {
    id: 'data',
    ...words.roles.data,
    hires: [
      hire('data-daily', 'pudding', 'sky'),
      hire('data-anomaly', 'sun', 'coral'),
      hire('data-sql', 'octagon', 'grape'),
      hire('data-report', 'mushroom', 'mint'),
      hire('data-industry', 'cloud', 'tangerine'),
    ],
  },
]

/** What the main bot's greeting offers to try first: the identity's own ideas, or general ones without an identity. */
export const suggestionsFor = (identity: Identity | null) =>
  identity ? [...identity.tries, words.askWhatYouDo] : [words.askWhatYouDo, words.dailyBriefing]

/** The demo team of the steps that explain what bots do; nobody is hired from it. */
export const DEMO_TEAM: Hire[] = [
  hire('demo-analyst', 'cloud', 'grape'),
  hire('demo-secretary', 'bell', 'mint'),
  hire('demo-researcher', 'pudding', 'sky'),
]
