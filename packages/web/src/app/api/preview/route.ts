import { draftMode } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getFrameworkStory } from '@/lib/framework-content'
import {
  configuredSecretIsStrong,
  configuredSecretsAreDistinct,
  createPreviewScope,
  maxPreviewRequestBytes,
  normalizeStorySlug,
  previewScopeCookieName,
  previewScopeCookieOptions,
  previewTokenMatches,
  readBoundedJson,
} from '@/lib/request-security'
import { resolveRuntimeSiteUrl } from '@/lib/site-url'

export async function POST(request: NextRequest) {
  const previewTokenSecret = process.env.MAGAZINE_PREVIEW_TOKEN_SECRET
  const previewCookieSecret = process.env.MAGAZINE_PREVIEW_COOKIE_SECRET
  if (
    !configuredSecretIsStrong(previewTokenSecret) ||
    !configuredSecretIsStrong(previewCookieSecret) ||
    !configuredSecretsAreDistinct(
      previewTokenSecret,
      previewCookieSecret,
      process.env.MAGAZINE_REVALIDATION_SECRET,
    )
  ) {
    return NextResponse.json({ error: 'Preview is not configured.' }, { status: 503 })
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') {
    return NextResponse.json({ error: 'Preview requests must use JSON.' }, { status: 415 })
  }

  const parsedBody = await readBoundedJson(request, maxPreviewRequestBytes)
  if (!parsedBody.ok) {
    if (parsedBody.reason === 'too-large') {
      return NextResponse.json({ error: 'The preview request is too large.' }, { status: 413 })
    }
    return NextResponse.json({ error: 'The preview request is not valid.' }, { status: 400 })
  }

  if (
    typeof parsedBody.value !== 'object' ||
    parsedBody.value === null ||
    Array.isArray(parsedBody.value) ||
    Object.keys(parsedBody.value).some((key) => !['slug', 'token'].includes(key))
  ) {
    return NextResponse.json({ error: 'The preview request is not valid.' }, { status: 400 })
  }

  const slug = normalizeStorySlug('slug' in parsedBody.value ? parsedBody.value.slug : null)
  const tokenValue = 'token' in parsedBody.value ? parsedBody.value.token : null
  const token = typeof tokenValue === 'string' ? tokenValue : undefined
  if (!slug || !previewTokenMatches(token, slug, previewTokenSecret)) {
    return NextResponse.json({ error: 'This preview link is invalid or expired.' }, { status: 401 })
  }

  if (!getFrameworkStory(slug)) {
    return NextResponse.json(
      { error: 'The requested preview could not be found.' },
      { status: 404 },
    )
  }

  const scope = createPreviewScope(slug, previewCookieSecret)
  if (!scope) {
    return NextResponse.json({ error: 'Preview is not configured.' }, { status: 503 })
  }

  const preview = await draftMode()
  preview.enable()

  const siteUrl = resolveRuntimeSiteUrl()
  const response = NextResponse.redirect(new URL(`/preview/stories/${slug}`, siteUrl), 303)
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Referrer-Policy', 'same-origin')
  response.cookies.set(previewScopeCookieName, scope, previewScopeCookieOptions(siteUrl))
  return response
}
