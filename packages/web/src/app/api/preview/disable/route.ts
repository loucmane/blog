import { draftMode } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getPublishedFrameworkStory } from '@/lib/framework-content'
import { normalizeStorySlug } from '@/lib/request-security'

export async function POST(request: NextRequest) {
  const preview = await draftMode()
  preview.disable()

  const formData = await request.formData()
  const slug = normalizeStorySlug(formData.get('slug'))
  const destination = slug && getPublishedFrameworkStory(slug) ? `/stories/${slug}` : '/'
  return NextResponse.redirect(new URL(destination, request.url), 303)
}
