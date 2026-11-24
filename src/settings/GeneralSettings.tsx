import { useState } from 'react'
import type { NengyongBotBridge } from '../../shared/bridge'
import { currentLanguage, type Language, LANGUAGES } from '../../shared/language'
import { strings } from '../../shared/strings'
import { TIMEZONE } from '../../shared/timezone'
import { Switch } from '../ui/Switch'
import { ipcErrorMessage } from '../ipcErrorMessage'
import { ACCENTS, type Preferences, THEMES } from '../preferences'
import { SettingsRow, SettingsSection, SettingsSelect } from './SettingsSection'

interface Props {
  bridge: Pick<NengyongBotBridge, 'setLanguage'>
  preferences: Preferences
  onPreferencesChange: (preferences: Preferences) => void
}

/** Look and feel. Every change applies at once; there is nothing to save. */
export function GeneralSettings({ bridge, preferences, onPreferencesChange }: Props) {
  const words = strings().settings.general
  const [languageError, setLanguageError] = useState<string | null>(null)
  const change = (patch: Partial<Preferences>) => onPreferencesChange({ ...preferences, ...patch })
  // the text is made as the app loads, so it reloads to show the new language
  const changeLanguage = (language: Language) =>
    bridge.setLanguage(language).then(
      () => location.reload(),
      (error) => setLanguageError(ipcErrorMessage(error)),
    )

  return (
    <div className="min-w-0 flex-1 overflow-y-auto px-10 pt-9 pb-8">
      <h2 id="settings-title" className="text-xl font-semibold tracking-tight">
        {words.title}
      </h2>

      <SettingsSection title={words.appearance}>
        <SettingsRow id="theme" label={words.theme}>
          <SettingsSelect
            id="theme"
            value={preferences.theme}
            options={THEMES}
            onChange={(theme) => change({ theme })}
          />
        </SettingsRow>
        <SettingsRow id="accent" label={words.accent} hint={words.accentHint}>
          <SettingsSelect
            id="accent"
            value={preferences.accent}
            options={ACCENTS}
            onChange={(accent) => change({ accent })}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={words.chat}>
        <SettingsRow id="send-key" label={words.sendKey} hint={words.sendKeyHint}>
          <Switch
            id="send-key"
            isOn={preferences.sendKey === 'mod-enter'}
            onChange={(isOn) => change({ sendKey: isOn ? 'mod-enter' : 'enter' })}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={words.region}>
        <SettingsRow
          id="language"
          label={words.language}
          hint={languageError && <span className="text-danger">{languageError}</span>}
        >
          <SettingsSelect id="language" value={currentLanguage()} options={LANGUAGES} onChange={changeLanguage} />
        </SettingsRow>
        <SettingsRow id="timezone" label={words.timezone} hint={words.timezoneHint}>
          <SettingsSelect
            id="timezone"
            value={TIMEZONE}
            options={[{ id: TIMEZONE, label: words.beijingTime }]}
            onChange={() => {}}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={words.developer}>
        <SettingsRow id="debug" label={words.debug} hint={words.debugHint}>
          <Switch id="debug" isOn={preferences.isDebug} onChange={(isDebug) => change({ isDebug })} />
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}
