import { type RefObject, useEffect, useEffectEvent, useRef } from 'react'

/** What the page in `frame` posts to this window goes to `onMessage`; posts from any other window are ignored. */
export function useFrameMessages(frame: RefObject<HTMLIFrameElement | null>, onMessage: (data: unknown) => void) {
  const handle = useEffectEvent(onMessage)

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== null && event.source === frame.current?.contentWindow) handle(event.data)
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [frame])
}

/** Posts `message` to the page in `frame` once per `key`; nothing while `message` is undefined. */
export function usePostToFrame(frame: RefObject<HTMLIFrameElement | null>, key: number | undefined, message: unknown) {
  const posted = useRef<number | undefined>(undefined)
  const post = useEffectEvent(() => {
    // a sandboxed page has an opaque origin: no target origin but '*' reaches it
    frame.current?.contentWindow?.postMessage(message, '*')
  })

  useEffect(() => {
    if (key === undefined || key === posted.current) return
    posted.current = key
    post()
  }, [key])
}
