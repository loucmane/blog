function shortHash(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

/**
 * Pairs each item with a short key derived from its content, so rendered document content has
 * stable keys without relying on array positions. Repeated identical items get a numbered suffix.
 */
export function withContentKeys<T>(
  items: readonly T[],
): ReadonlyArray<{ readonly item: T; readonly key: string }> {
  const seen = new Map<string, number>()
  return items.map((item) => {
    const base = shortHash(JSON.stringify(item))
    const occurrence = seen.get(base) ?? 0
    seen.set(base, occurrence + 1)
    return { item, key: occurrence === 0 ? base : `${base}-${occurrence}` }
  })
}
