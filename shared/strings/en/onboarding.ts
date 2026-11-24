import { plural } from '../../language'
import type { Strings } from '../../strings'

export const onboarding: Strings['onboarding'] = {
  next: 'Next',
  buildFailed: (reason) => `Could not build the team: ${reason}`,
  building: 'Building your team…',
  dialogLabel: 'Getting started',
  skipIntro: 'Skip intro',
  back: 'Back',
  background: {
    ask: 'Keep an eye on competitors and report every Monday morning',
    taskTitle: 'Competitor weekly',
    title: 'Done in the background, reported back',
    lede: 'Work you hand off runs in the background with its progress on the island at the top; when it is done, the result comes back to the chat.',
    handOffBefore: 'Sure. ',
    handOffAfter: ' will look into it, every Monday at 9:00 from now on.',
    routineTag: 'Routine · Mondays 09:00',
    result:
      ' is done: of the 3 this week, A cut prices by 20%, B launched a team plan and C was quiet. The full report is in the library: “competitor-weekly-11-24.md”.',
    replay: 'Replay',
  },
  identity: {
    title: 'What do you do?',
    lede: "I'll hire 5 bots for your role to start. Click one to let it go; you can add or remove bots any time.",
    rolesLabel: 'Choose a role',
    hireLabel: (name, duty) => `${name}: ${duty}`,
    build: 'Build the team',
    skip: 'Skip',
    pickHint: "Pick a role to see whom I'd hire first",
    nobody: (boss, secretary) => `Nobody? Then it's just ${boss} and ${secretary} for now`,
    hiring: (count) => `Hiring ${plural(count, 'bot')} · click an avatar to drop or add it back`,
  },
  meet: {
    nameTitle: 'First, give me a name',
    nameHint: (name) => `Leave it empty and I'll go by ${name}`,
    addressTitle: 'What should I call you?',
    addressPlaceholder: 'For example: Kevin, Sam, Boss',
    intro: "I'm your chief of staff: tell me what you need and I'll decide who does it.",
    named: (name) =>
      `Great, I'm “${name}” from now on. I'll remember what to call you, and the other bots will call you that too.`,
    nextUp: 'Next, let me show you what we can do.',
    hello: (address) => (address ? `Hello, ${address}!` : 'Hello!'),
    ok: 'OK',
  },
  model: {
    connectFailed: (reason) => `Could not connect: ${reason}`,
    title: 'Connect a model',
    lede: 'Bots think with it. Start with DeepSeek; you can add other providers later in Settings.',
    savedKey: (hint) => `Saved ${hint}; leave empty to keep it`,
    keyNote: 'Stored only on this computer, encrypted by the system keychain. ',
    keyLink: 'No key? Create one at DeepSeek ↗',
    connecting: 'Connecting…',
    connect: 'Connect',
    later: 'Later',
    connected: 'Connected',
  },
  team: {
    task: 'Watch competitors, report on Mondays',
    newJob: 'New job',
    title: 'Every bot owns one job',
    lede: (boss) => `${boss} hands each job to the bot that fits it best, and hires a new one when none does.`,
  },
}
