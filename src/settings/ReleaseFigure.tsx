import { AnimatePresence } from 'motion/react'
import { useId, useState } from 'react'
import { Dialog } from '../ui/Dialog'
import type { ReleaseMedia } from './releases'
import { strings } from '../../shared/strings'

/** A picture or a short animation in the release notes; a click shows it large, another click or Esc puts it back. */
export function ReleaseFigure({ media }: { media: ReleaseMedia }) {
  const [isLarge, setIsLarge] = useState(false)
  const largeId = useId()

  return (
    <>
      <button
        type="button"
        aria-label={strings().settings.releaseNotes.enlarge(media.alt)}
        onClick={() => setIsLarge(true)}
        className="block w-full cursor-zoom-in overflow-hidden rounded-lg bg-side shadow-ring"
      >
        <Picture media={media} />
      </button>
      <AnimatePresence>
        {isLarge && (
          <Dialog
            labelledBy={largeId}
            onClose={() => setIsLarge(false)}
            className="w-[min(1200px,92vw)] overflow-hidden rounded-xl bg-side"
          >
            <button
              type="button"
              aria-label={strings().settings.releaseNotes.shrink}
              onClick={() => setIsLarge(false)}
              className="block w-full cursor-zoom-out"
            >
              <Picture media={media} id={largeId} />
            </button>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}

function Picture({ media, id }: { media: ReleaseMedia; id?: string }) {
  const image = <img id={id} src={media.src} alt={media.alt} className="block w-full" />
  switch (media.kind) {
    case 'image':
      return image
    case 'animation':
      return (
        <picture>
          <source media="(prefers-reduced-motion: reduce)" srcSet={media.still} />
          {image}
        </picture>
      )
    default:
      return media satisfies never
  }
}
