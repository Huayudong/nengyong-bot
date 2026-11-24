import type { Strings } from '../../strings'

export const ui: Strings['ui'] = {
  drawImageFailed: 'Could not draw the image',
  copied: {
    done: 'Copied',
    failed: 'Copy failed',
  },
  dialogOutsidePresence:
    'Put Dialog directly inside AnimatePresence: <AnimatePresence>{isOpen && <XxxDialog />}</AnimatePresence>',
  cancel: 'Cancel',
  darkMode: 'Dark mode',
  switchToLight: 'Switch to light',
  switchToDark: 'Switch to dark',
}
