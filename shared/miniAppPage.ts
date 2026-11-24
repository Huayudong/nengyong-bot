const RUNTIME = `(() => {
  let data = __DATA__
  const listeners = []
  const post = (message) => window.parent.postMessage(message, '*')
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || !event.data || event.data.kind !== 'data') return
    data = event.data.data
    for (const listener of listeners) listener(data)
  })
  window.addEventListener('error', (event) => post({ kind: 'error', message: String(event.message) }))
  window.addEventListener('unhandledrejection', (event) => post({ kind: 'error', message: String(event.reason) }))
  window.nengyongbot = Object.freeze({
    get data() { return data },
    onData(listener) { listeners.push(listener) },
    save(next) { data = next; post({ kind: 'save', data: next }) },
    ask(text) { post({ kind: 'ask', text: String(text) }) },
  })
  window.superbot = window.nengyongbot
})()`

/** A mini app's HTML with `window.nengyongbot` defined before any of its own scripts: its data, saving, and asking its bot. */
export function miniAppPage(html: string, data: unknown): string {
  // `<` escaped: a "</script>" inside the data would end the script early and let the data run as markup
  const json = JSON.stringify(data ?? null).replace(/</g, '\\u003c')
  const script = `<script>${RUNTIME.replace('__DATA__', () => json)}</script>`
  // after <head> or <html>, never before a doctype: that would put the page in quirks mode
  const anchor = /<head\b[^>]*>/i.exec(html) ?? /<html\b[^>]*>/i.exec(html) ?? /^\s*<!doctype[^>]*>/i.exec(html)
  if (!anchor) return `${script}${html}`
  const at = anchor.index + anchor[0].length
  return `${html.slice(0, at)}${script}${html.slice(at)}`
}
