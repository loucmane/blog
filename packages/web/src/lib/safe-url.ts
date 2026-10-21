const linkProtocols: readonly string[] = ['http:', 'https:', 'mailto:']

/**
 * The value when it is a full web or email address, which is safe to give readers as a link, and
 * null otherwise. Any other scheme, such as `javascript:` or `data:`, can run script or show a page
 * that the reader did not ask for.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    if (!linkProtocols.includes(url.protocol)) return null
    // Credentials belong only to web addresses: an email address never carries a user name or
    // password, so `mailto://user:secret@host/` is rejected rather than passed through.
    if (url.protocol === 'mailto:' && (url.username || url.password)) return null
    return value
  } catch {
    return null
  }
}
