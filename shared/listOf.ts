import { z } from 'zod'

/** A stored list where one bad item is dropped instead of failing the whole list. */
export function listOf<T>(item: z.ZodType<T>) {
  return z.array(z.unknown()).transform((items) =>
    items.flatMap((raw) => {
      const parsed = item.safeParse(raw)
      return parsed.success ? [parsed.data] : []
    }),
  )
}
