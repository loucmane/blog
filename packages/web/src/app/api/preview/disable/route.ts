import { draftMode } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { previewScopeCookieName, requestOriginMatches } from '@/lib/request-security'
import { resolveRuntimeSiteUrl } from '@/lib/site-url'

export async function POST(request: NextRequest) {
  const siteUrl = resolveRuntimeSiteUrl()
  if (
    !requestOriginMatches(
      request.headers.get('origin'),
      siteUrl,
      request.headers.get('sec-fetch-site'),
    )
  ) {
    return NextResponse.json({ error: 'This preview action is not authorized.' }, { status: 403 })
  }

  const preview = await draftMode()
  preview.disable()

  const response = NextResponse.redirect(new URL('/', siteUrl), 303)
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.cookies.set(previewScopeCookieName, '', {
    expires: new Date(0),
    httpOnly: true,
    path: '/preview',
    sameSite: 'strict',
  })
  return response
}
