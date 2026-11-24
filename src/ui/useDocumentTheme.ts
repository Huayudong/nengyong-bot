import { useLayoutEffect } from 'react'

/** Puts the chosen theme on <html>, where src/index.css reads it; dialogs render into <body>, so it cannot sit lower. */
export function useDocumentTheme(theme: 'light' | 'dark') {
  // layout effect: the first paint already has the right colours
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
}
