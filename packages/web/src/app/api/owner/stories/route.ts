import { randomUUID } from 'node:crypto'

import { normalizeSlug } from '@/server/content/domain'
import { InvalidContentTransitionError } from '@/server/content/errors'
import { assertOwnerMutationRequest, readOwnerJson, withOwner } from '@/server/owner/api'
import { createOwnerStorySchema } from '@/server/owner/contracts'
import { createOwnerContentDocument } from '@/server/owner/document'
import { getOwnerRuntime } from '@/server/owner/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  return withOwner(request, async () => ({
    stories: await getOwnerRuntime().workspace.listStories(),
  }))
}

export async function POST(request: Request) {
  return withOwner(request, async (owner) => {
    assertOwnerMutationRequest(request)
    const input = await readOwnerJson(request, createOwnerStorySchema)
    const articleId = `article-${randomUUID()}`
    const slug = normalizeSlug(input.title)
    if (slug.length < 2) {
      throw new InvalidContentTransitionError('Add a title with at least two letters or numbers.')
    }
    return getOwnerRuntime().content.createArticle({
      actorId: owner.id,
      dek: input.dek,
      document: createOwnerContentDocument({
        articleId,
        document: input.document,
        title: input.title,
      }),
      id: articleId,
      idempotencyKey: input.idempotencyKey,
      slug,
      title: input.title,
    })
  })
}
