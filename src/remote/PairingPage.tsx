import { type ReactNode, Suspense, use } from 'react'
import { MAIN_BOT } from '../../shared/bot'
import { BotAvatar } from '../bot/BotAvatar'
import type { Answer, Pairing } from './pairing'
import { strings } from '../../shared/strings'

const words = strings().remote.pairing

const ANSWER_TEXT: Record<Exclude<Answer, 'allowed'>, { title: string; body: string }> = {
  denied: {
    title: words.declined,
    body: words.declinedHint,
  },
  gone: {
    title: words.expired,
    body: words.expiredHint,
  },
  lost: {
    title: words.lost,
    body: words.lostHint,
  },
}

/** What a browser that has not paired sees: the code to check on the computer, until the computer answers. */
export function PairingPage({ pairing }: { pairing: Promise<Pairing> }) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-3 px-9 text-center">
      <BotAvatar bot={MAIN_BOT} size={64} />
      <Suspense fallback={<p className="text-md text-soft">{words.connecting}</p>}>
        <Asking pairing={pairing} />
      </Suspense>
    </main>
  )
}

function Asking({ pairing }: { pairing: Promise<Pairing> }) {
  const asked = use(pairing)
  if (asked.kind === 'failed') return <Outcome title={strings().remote.unreachable} body={asked.message} />
  return (
    <>
      <h1 className="text-xl font-semibold">{words.title}</h1>
      <p className="text-md text-soft">{words.enterCode}</p>
      <p aria-label={words.code(asked.code)} className="my-3 flex justify-center gap-2.5">
        {[...asked.code].map((digit, index) => (
          <span
            key={index}
            aria-hidden
            className="grid h-14 w-12 place-items-center rounded-lg bg-bubble font-mono text-2xl font-semibold"
          >
            {digit}
          </span>
        ))}
      </p>
      <Suspense fallback={<Waiting>{words.waiting}</Waiting>}>
        <Answered answer={asked.answer} />
      </Suspense>
    </>
  )
}

function Answered({ answer }: { answer: Promise<Answer> }) {
  const status = use(answer)
  if (status === 'allowed') return <Waiting>{words.connected}</Waiting>
  return <Outcome {...ANSWER_TEXT[status]} />
}

function Waiting({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-muted">
      <span className="size-3 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" />
      {children}
    </p>
  )
}

function Outcome({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-md text-soft">{body}</p>
      <button onClick={() => location.reload()} className="mt-4 h-11 rounded-full bg-ink px-6 text-md text-canvas">
        {strings().remote.reconnect}
      </button>
    </>
  )
}
