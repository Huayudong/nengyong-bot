import { strings } from '../../shared/strings'
import appIcon from './appIcon.webp'

/** Nengyong Key: a placeholder until the service at api.nengyongbot.com opens; it says how it will work. */
export function NengyongKeySettings() {
  const words = strings().settings.nengyongKey
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center overflow-y-auto px-10 pt-20 pb-8">
      <div className="w-full max-w-[440px]">
        <h2
          id="settings-title"
          className="flex items-center justify-center gap-2.5 text-xl font-semibold tracking-tight"
        >
          <img src={appIcon} alt="" className="size-10" />
          {strings().settings.dialog.pages.nengyongKey}
        </h2>
        <p className="mt-1.5 text-center text-sm text-muted">{words.intro}</p>
        <p className="mx-auto mt-4 w-fit rounded-full bg-bubble px-3 py-1 text-xs text-soft">{words.comingSoon}</p>
        <h3 className="mt-10 mb-1 px-1 text-sm text-muted">{words.stepsTitle}</h3>
        <ol className="divide-y divide-line border-y border-line">
          {words.steps.map((step, index) => (
            <li key={step.title} className="flex items-center gap-4 px-1 py-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bubble text-sm text-soft">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-md">{step.title}</span>
                <span className="block text-xs text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
