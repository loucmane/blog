import type { NextRequest } from 'next/server'

import { handleStoryRequest } from '@/server/distribution/story-requests'

/**
 * Next 16 Proxy, formerly Middleware, which always runs on the Node.js runtime. It resolves story
 * slugs before the page renders: an old slug gets a 308 to the story's slug now and a story readers
 * can no longer see gets a 410 (server/distribution/story-requests.ts). Deleting this file returns
 * `/stories/[slug]` to its 404-only behavior.
 */
export function proxy(request: NextRequest) {
  return handleStoryRequest(request)
}

export const config = {
  matcher: '/stories/:slug',
}
