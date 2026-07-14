import { draftMode } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getFrameworkStory } from '@/lib/framework-content'
import {
  createPreviewScope,
  normalizeStorySlug,
  previewScopeCookieName,
  previewScopeLifetimeSeconds,
  secureTokenMatches,
} from '@/lib/request-security'
import { resolveSiteUrl } from '@/lib/site-url'

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'The preview request is not valid.' }, { status: 400 })
  }

  const secretValue = formData.get('secret')
  const secret = typeof secretValue === 'string' ? secretValue : null
  if (!secureTokenMatches(secret, process.env.MAGAZINE_PREVIEW_SECRET)) {
    return NextResponse.json({ error: 'This preview link is invalid or expired.' }, { status: 401 })
  }

  const slug = normalizeStorySlug(formData.get('slug'))
  if (!slug || !getFrameworkStory(slug)) {
    return NextResponse.json(
      { error: 'The requested preview could not be found.' },
      { status: 404 },
    )
  }

  const scope = createPreviewScope(slug, process.env.MAGAZINE_PREVIEW_SECRET)
  if (!scope) {
    return NextResponse.json({ error: 'Preview is not configured.' }, { status: 503 })
  }

  const preview = await draftMode()
  preview.enable()

  const siteUrl = resolveSiteUrl()
  const response = NextResponse.redirect(new URL(`/preview/stories/${slug}`, siteUrl), 303)
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.cookies.set(previewScopeCookieName, scope, {
    httpOnly: true,
    maxAge: previewScopeLifetimeSeconds,
    path: '/preview',
    sameSite: 'strict',
    secure: siteUrl.protocol === 'https:',
  })
  return response
}
