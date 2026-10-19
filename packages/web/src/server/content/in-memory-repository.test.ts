import { describe, expect, it } from 'vitest'

import type { AuthorProfile } from './domain'
import { InMemoryContentRepository } from './in-memory-repository'

const createdAt = '2026-10-19T08:00:00.000Z'

const alpha: AuthorProfile = {
  bio: 'Alpha writes about rooms.',
  createdAt,
  displayName: 'Alpha',
  id: 'author-alpha',
  slug: 'alpha',
  updatedAt: createdAt,
}

describe('in-memory content repository', () => {
  it('finds an author by slug, and nothing for an unknown slug', async () => {
    const repository = new InMemoryContentRepository()
    await repository.transaction((transaction) => transaction.saveAuthor(alpha))

    expect(await repository.inspect((transaction) => transaction.getAuthorBySlug('alpha'))).toEqual(
      alpha,
    )
    expect(
      await repository.inspect((transaction) => transaction.getAuthorBySlug('author-alpha')),
    ).toBeNull()
    expect(await repository.inspect((transaction) => transaction.getAuthorBySlug(''))).toBeNull()
  })

  it('hands back a copy of the author, never the stored profile', async () => {
    const repository = new InMemoryContentRepository()
    await repository.transaction((transaction) => transaction.saveAuthor(alpha))

    const found = await repository.inspect((transaction) => transaction.getAuthorBySlug('alpha'))
    ;(found as { displayName: string }).displayName = 'Changed'

    expect(
      await repository.inspect((transaction) => transaction.getAuthorBySlug('alpha')),
    ).toMatchObject({ displayName: 'Alpha' })
  })
})
