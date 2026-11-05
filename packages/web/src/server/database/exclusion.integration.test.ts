import { randomUUID } from 'node:crypto'

import { Pool } from 'pg'
import { afterEach, beforeEach, describe, it } from 'vitest'

import {
  assertExclusion,
  queryExclusionSurfaces,
  seedExclusionCorpus,
  type ExclusionCorpus,
  type ExclusionQueries,
} from '../distribution/exclusion-suite'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresRelatedStories } from './postgres-related-stories'
import { PostgresSearchProjection } from './postgres-search-projection'
import { PostgresSearchQuery } from './postgres-search-query'

/** Same disposable database as the other content suites; never falls back to a host database. */
function integrationDatabaseUrl(): string {
  const value = process.env.TASK42_DATABASE_URL
  if (!value) throw new Error('TASK42_DATABASE_URL is required for the AC-03 integration suite')
  return value
}

describe('shared AC-03 distribution exclusion on PostgreSQL', () => {
  let admin: Pool
  let pool: Pool
  let schema: string
  let context: ExclusionQueries
  let corpus: ExclusionCorpus

  beforeEach(async () => {
    const connectionString = integrationDatabaseUrl()
    schema = `ac03_${randomUUID().replaceAll('-', '')}`
    admin = new Pool({ connectionString, max: 1 })
    await admin.query(`CREATE SCHEMA "${schema}"`)
    pool = new Pool({ connectionString, max: 2, options: `-c search_path=${schema}` })
    await applyContentMigrations(pool, await readContentMigrations())
    const repository = new PostgresContentRepository(pool)
    context = {
      repository,
      search: new PostgresSearchQuery(pool),
      related: new PostgresRelatedStories(pool),
    }
    corpus = await seedExclusionCorpus(repository, new PostgresSearchProjection(pool))
  }, 60_000)

  afterEach(async () => {
    await pool?.end()
    if (admin) {
      try {
        await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      } finally {
        await admin.end()
      }
    }
  })

  // The integration runner discovers *.integration.test.ts automatically. A new query surface
  // registers once in queryExclusionSurfaces and runs here as well as in the unit suite.
  it.each(queryExclusionSurfaces)(
    '$name excludes hidden articles and unpublished revisions',
    async (surface) => {
      assertExclusion(surface.name, corpus, await surface.read(context, corpus))
    },
    60_000,
  )
})
