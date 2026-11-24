/** A prefix, the time and a random tail: unique even when two ids are made in the same millisecond. */
export function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** When newId made `id`; undefined for an id it did not make, such as a built-in bot's. */
export function timeOfId(id: string, prefix: string): number | undefined {
  // Date.now() in base 36 is 8 digits until 2059; the random tail can come out shorter than 4
  const stamp = new RegExp(`^${prefix}([0-9a-z]{8})[0-9a-z]{0,4}$`).exec(id)?.[1]
  return stamp === undefined ? undefined : Number.parseInt(stamp, 36)
}
