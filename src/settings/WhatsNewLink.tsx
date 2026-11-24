import { strings } from '../../shared/strings'

const RELEASES_URL = 'https://github.com/zhukunpenglinyutong/nengyong-bot/releases'

/** Opens a version's page on GitHub Releases in the browser. */
export function WhatsNewLink({ version }: { version: string }) {
  return (
    <a href={`${RELEASES_URL}/tag/v${version}`} target="_blank" rel="noreferrer" className="text-sm text-accent">
      {strings().settings.update.whatsNew}
    </a>
  )
}
