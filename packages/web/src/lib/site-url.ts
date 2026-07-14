const fallbackSiteUrl = new URL('http://localhost:3000')

export function resolveSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): URL {
  if (!value) {
    return fallbackSiteUrl
  }

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url : fallbackSiteUrl
  } catch {
    return fallbackSiteUrl
  }
}
