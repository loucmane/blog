import { expirePublicReader } from '@/reader/cache'
import { PostgresContentRepository } from '@/server/database/postgres-content-repository'
import { PostgresOutboxStore } from '@/server/database/postgres-outbox-store'
import { PostgresSearchProjection } from '@/server/database/postgres-search-projection'
import { createOutboxDispatcher } from '@/server/outbox/dispatcher'
import { answerOutboxDrainRequest } from '@/server/outbox/drain'
import { getOwnerRuntime } from '@/server/owner/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  return answerOutboxDrainRequest(request, {
    secret: process.env.MAGAZINE_OUTBOX_DRAIN_SECRET,
    createDispatcher: (logger) => {
      const { pool, repository } = getOwnerRuntime()
      if (!pool || !(repository instanceof PostgresContentRepository)) {
        throw new Error('The outbox drain requires the owner PostgreSQL runtime.')
      }
      return createOutboxDispatcher({
        cache: {
          revalidate: async ({ slugs }) => {
            for (const slug of slugs) expirePublicReader(slug)
          },
        },
        content: repository,
        search: new PostgresSearchProjection(pool),
        logger,
        store: new PostgresOutboxStore(repository),
      })
    },
  })
}
