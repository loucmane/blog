import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getFrameworkStory, storyCacheTag } from '@/lib/framework-content'
import {
  configuredSecretIsStrong,
  configuredSecretsAreDistinct,
  maxRevalidationRequestBytes,
  normalizeStorySlug,
  readBearerToken,
  readBoundedJson,
  secureTokenMatches,
} from '@/lib/request-security'

export async function POST(request: NextRequest) {
  const revalidationSecret = process.env.MAGAZINE_REVALIDATION_SECRET
  if (
    !configuredSecretIsStrong(revalidationSecret) ||
    !configuredSecretsAreDistinct(
      revalidationSecret,
      process.env.MAGAZINE_PREVIEW_TOKEN_SECRET,
      process.env.MAGAZINE_PREVIEW_COOKIE_SECRET,
    )
  ) {
    return NextResponse.json({ error: 'Revalidation is not configured.' }, { status: 503 })
  }

  const providedToken = readBearerToken(request.headers.get('authorization'))
  if (!secureTokenMatches(providedToken, revalidationSecret)) {
    return NextResponse.json(
      { error: 'This revalidation request is not authorized.' },
      { status: 401 },
    )
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') {
    return NextResponse.json({ error: 'Revalidation requests must use JSON.' }, { status: 415 })
  }

  const parsedBody = await readBoundedJson(request, maxRevalidationRequestBytes)
  if (!parsedBody.ok) {
    return NextResponse.json(
      {
        error:
          parsedBody.reason === 'too-large'
            ? 'The revalidation request is too large.'
            : 'The revalidation request is not valid JSON.',
      },
      { status: parsedBody.reason === 'too-large' ? 413 : 400 },
    )
  }

  const body = parsedBody.value

  const slug = normalizeStorySlug(
    typeof body === 'object' && body !== null && 'slug' in body ? body.slug : null,
  )
  if (!slug || !getFrameworkStory(slug)) {
    return NextResponse.json({ error: 'The requested story could not be found.' }, { status: 404 })
  }

  revalidateTag(storyCacheTag(slug), { expire: 0 })
  revalidatePath('/')

  return NextResponse.json({ revalidated: true, slug })
}
