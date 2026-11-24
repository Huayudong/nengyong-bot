import { type Bot, MAIN_BOT_ID, newBotId, secretary } from '../shared/bot'
import type { Entry, OnboardingChoices } from '../shared/bridge'
import { strings } from '../shared/strings'
import { newId } from '../shared/newId'
import type { Store } from './store'

/** The onboarding never ran, even if bots and chats were saved before it existed. Then the renderer starts with it. */
export const needsOnboarding = (store: Store) => store.get().onboardedAt === null

const secretaryDuty = () => strings().harness.onboarding.secretaryDuty

/** Applies what the user settled in the onboarding: remembers how to address them, hires the secretary and the bots asked, and the main bot greets. */
export function onboard(store: Store, choices: OnboardingChoices, hasModel: boolean): { bots: Bot[]; greeting: Entry } {
  if (store.get().onboardedAt !== null) throw new Error(strings().harness.onboarding.alreadyDone)
  const { address, hires, suggestions } = choices
  store.update((state) => ({ ...state, onboardedAt: Date.now() }))
  if (address) {
    const text = strings().harness.onboarding.address(address)
    const fact = { id: newId('u'), text, at: Date.now() }
    store.update((state) => ({ ...state, userFacts: [...state.userFacts, fact] }))
  }
  const hired = [
    { bot: secretary(), duty: secretaryDuty() },
    ...hires.map(({ duty, ...look }) => ({ bot: { ...look, id: newBotId() }, duty })),
  ]
  for (const { bot, duty } of hired) store.addBot(bot, duty)
  const bots = hired.map(({ bot }) => bot)
  const greeting = store.append(MAIN_BOT_ID, {
    kind: 'bot',
    text: greetingText(choices, bots, hasModel),
    ...(suggestions.length ? { suggestions } : {}),
  })
  return { bots, greeting }
}

function greetingText({ bossName, address, suggestions }: OnboardingChoices, bots: Bot[], hasModel: boolean) {
  const mentions = bots.map((bot) => `[${bot.name}](bot:${bot.id})`)
  return [
    strings().harness.onboarding.hello(address, bossName),
    strings().harness.onboarding.hired(listed(mentions)),
    hasModel ? '' : strings().harness.onboarding.noModel,
    suggestions.length ? strings().harness.onboarding.tryThese : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

const listed = (names: string[]) => (names.length > 1 ? strings().harness.onboarding.list(names) : (names[0] ?? ''))
