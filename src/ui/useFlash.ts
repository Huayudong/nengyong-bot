import { useState } from 'react'
import { useAutoDismiss } from './useAutoDismiss'

const FLASH_MS = 2000

/** A word on what the user just did, said where they did it and gone after FLASH_MS: 已复制, 已保存. Saying it again restarts the clock. */
export function useFlash<T>() {
  const [flash, setFlash] = useState<{ id: number; value: T }>()
  useAutoDismiss(flash?.id, FLASH_MS, () => setFlash(undefined))
  return [flash?.value, (value: T) => setFlash({ id: Date.now(), value })] as const
}
