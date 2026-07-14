import { draftMode } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getFrameworkStory } from '@/lib/framework-content'
import { normalizeStorySlug, secureTokenMatches } from '@/lib/request-security'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (!secureTokenMatches(secret, process.env.MAGAZINE_PREVIEW_SECRET)) {
    return NextResponse.json({ error: 'This preview link is invalid or expired.' }, { status: 401 })
  }

  const slug = normalizeStorySlug(request.nextUrl.searchParams.get('slug'))
  if (!slug || !getFrameworkStory(slug)) {
    return NextResponse.json(
      { error: 'The requested preview could not be found.' },
      { status: 404 },
    )
  }

  const preview = await draftMode()
  preview.enable()
  return NextResponse.redirect(new URL(`/preview/stories/${slug}`, request.url), 307)
}
