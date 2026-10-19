const linkProtocols: readonly string[] = ['http:', 'https:', 'mailto:']

/**
 * The value when it is a full web or email address, which is safe to give readers as a link, and
 * null otherwise. Any other scheme, such as `javascript:` or `data:`, can run script or show a page
 * that the reader did not ask for.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    return linkProtocols.includes(new URL(value).protocol) ? value : null
  } catch {
    return null
  }
}
