import { draftMode } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getPublishedFrameworkStory } from '@/lib/framework-content'
import { normalizeStorySlug, previewScopeCookieName } from '@/lib/request-security'
import { resolveSiteUrl } from '@/lib/site-url'

export async function POST(request: NextRequest) {
  const preview = await draftMode()
  preview.disable()

  const formData = await request.formData()
  const slug = normalizeStorySlug(formData.get('slug'))
  const destination = slug && getPublishedFrameworkStory(slug) ? `/stories/${slug}` : '/'
  const response = NextResponse.redirect(new URL(destination, resolveSiteUrl()), 303)
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
