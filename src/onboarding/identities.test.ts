import { expect, it } from 'vitest'
import { OnboardingChoices } from '../../shared/bridge'
import { IDENTITIES, suggestionsFor } from './identities'

it('offers for every identity a team and suggestions the harness accepts', () => {
  for (const identity of [...IDENTITIES, null]) {
    const choices = {
      bossName: 'CEO',
      address: '',
      hires: (identity?.hires ?? []).map(({ id: _crewId, ...look }) => look),
      suggestions: suggestionsFor(identity),
    }
    expect(OnboardingChoices.safeParse(choices).error, identity?.label).toBeUndefined()
  }
})
