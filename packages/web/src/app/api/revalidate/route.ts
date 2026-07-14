import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getFrameworkStory, storyCacheTag } from '@/lib/framework-content'
import { normalizeStorySlug, readBearerToken, secureTokenMatches } from '@/lib/request-security'

export async function POST(request: NextRequest) {
  const providedToken = readBearerToken(request.headers.get('authorization'))
  if (!secureTokenMatches(providedToken, process.env.MAGAZINE_REVALIDATION_SECRET)) {
    return NextResponse.json(
      { error: 'This revalidation request is not authorized.' },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'The revalidation request is not valid JSON.' },
      { status: 400 },
    )
  }

  const slug = normalizeStorySlug(
    typeof body === 'object' && body !== null && 'slug' in body ? body.slug : null,
  )
  if (!slug || !getFrameworkStory(slug)) {
    return NextResponse.json({ error: 'The requested story could not be found.' }, { status: 404 })
  }

  revalidateTag(storyCacheTag(slug), { expire: 0 })
  revalidatePath('/')
  revalidatePath(`/stories/${slug}`)

  return NextResponse.json({ revalidated: true, slug })
}
