const developmentFallbackSiteUrl = new URL('http://localhost:3000')
const unconfiguredProductionSiteUrl = new URL('https://unconfigured.magazine.invalid')

export interface SiteUrlOptions {
  environment?: string
}

function fallbackSiteUrl(environment: string | undefined): URL {
  return environment === 'production' ? unconfiguredProductionSiteUrl : developmentFallbackSiteUrl
}

function isLoopbackHost(hostname: string): boolean {
  return ['127.0.0.1', '[::1]', 'localhost'].includes(hostname)
}

export function resolveSiteUrl(
  value = process.env.NEXT_PUBLIC_SITE_URL,
  { environment = process.env.NODE_ENV }: SiteUrlOptions = {},
): URL {
  const fallback = fallbackSiteUrl(environment)
  if (!value) {
    return fallback
  }

  try {
    const url = new URL(value)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    ) {
      return fallback
    }

    if (
      environment === 'production' &&
      url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && isLoopbackHost(url.hostname))
    ) {
      return fallback
    }

    return url
  } catch {
    return fallback
  }
}
