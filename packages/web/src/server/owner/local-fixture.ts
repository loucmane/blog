import { resolveOwnerFixtureConfiguration } from './config'

/** Fail closed, including a misconfigured production runtime with the test flag still set. */
export function localOwnerFixture(requestHeaders: Headers) {
  try {
    const fixture = resolveOwnerFixtureConfiguration()
    if (!fixture || requestHeaders.get('host') !== fixture.baseUrl.host) return null
    const forwardedHost = requestHeaders.get('x-forwarded-host')
    if (forwardedHost && forwardedHost !== fixture.baseUrl.host) return null
    return fixture
  } catch {
    return null
  }
}
