import { NextResponse } from 'next/server'

import { readBearerToken, secureTokenMatches } from '@/lib/request-security'
import { resolveOwnerFixtureConfiguration } from '@/server/owner/config'
import { createOwnerFixtureSession, ownerFixtureCookieName } from '@/server/owner/session'
import { limitInternalAuthenticationFailure } from '@/server/security/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const fixture = resolveOwnerFixtureConfiguration()
  const provided = readBearerToken(request.headers.get('authorization'))
  if (!fixture) {
    return NextResponse.json({ error: 'This test session is not available.' }, { status: 404 })
  }
  if (!secureTokenMatches(provided, fixture.token)) {
    const limited = limitInternalAuthenticationFailure(request, 'fixture-session')
    if (limited) return limited
    return NextResponse.json({ error: 'This test session is not available.' }, { status: 404 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ownerFixtureCookieName, createOwnerFixtureSession(), {
    httpOnly: true,
    maxAge: 60 * 60,
    path: '/',
    sameSite: 'strict',
    secure: fixture.baseUrl.protocol === 'https:',
  })
  return response
}
