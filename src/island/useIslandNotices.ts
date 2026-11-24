import { useReducer } from 'react'
import type { Entry } from '../../shared/bridge'
import type { Trace } from '../../shared/debug'
import { islandNotices, NO_NOTICES } from './islandNotices'

/** The island's queue of passing news, fed with every entry the harness reports. */
export function useIslandNotices() {
  const [state, dispatch] = useReducer(islandNotices, NO_NOTICES)
  return {
    current: state.queue[0],
    onEntry: (botId: string, activeId: string, entry: Entry, before: Entry[], isDebug: boolean) =>
      dispatch({ kind: 'entry', botId, activeId, entry, before, isDebug }),
    onTrace: (botId: string, activeId: string, trace: Trace, before: Trace | undefined) =>
      dispatch({ kind: 'trace', botId, activeId, trace, before }),
    seen: (botId: string) => dispatch({ kind: 'seen', botId }),
    dismiss: (id: number) => dispatch({ kind: 'dismiss', id }),
  }
}
