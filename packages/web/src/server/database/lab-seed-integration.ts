// Registered by postgres.integration.test.ts for the existing Docker PostgreSQL/S3 runner.
import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { Pool } from 'pg'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '../../app/api/internal/lab-seed/route'
import { readHomeView } from '../../reader/read-model'
import { CURRENT_CONTENT_DOCUMENT_VERSION } from '../content/document'
import { sha256Bytes } from '../content/media'
import { labImages, labStories } from '../lab/north-house'
import { labStorySlug } from '../lab/seed'
import { getOwnerRuntime, type OwnerRuntime } from '../owner/runtime'
import {
  labSeedEnvironmentKeys,
  refusedLabSeedEnvironments,
} from '../../../tests/support/lab-seed-environments'
import { applyContentMigrations, readContentMigrations } from './migrations'
import { PostgresContentRepository } from './postgres-content-repository'
import { S3OriginalObjectStore } from './s3-original-object-store'

// Only framework cache invalidation needs a request-context substitute. Persistence is real.
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

export function labSeedIntegrationTests({
  databaseUrl,
  schema,
  s3Endpoint,
}: {
  databaseUrl: string
  schema: string
  s3Endpoint: string
}) {
  describe('hosted Preview seed with PostgreSQL and S3 originals', () => {
    if (!/^lab_seed_[a-f0-9]+$/.test(schema)) throw new Error('Invalid test schema name')
    const target = new URL(databaseUrl)
    target.searchParams.set('options', `-c search_path=${schema}`)
    const admin = new Pool({ connectionString: databaseUrl, max: 1 })
    const pool = new Pool({ connectionString: target.href, max: 2 })
    const bucket = schema.replaceAll('_', '-')
    // Synthetic credentials for the existing Docker S3 fixture, never a hosted account.
    const fixtureCredentials = {
      accessKeyId: 'task42-access',
      secretAccessKey: 'task42-local-secret',
    }
    const client = new S3Client({
      endpoint: s3Endpoint,
      forcePathStyle: true,
      region: 'us-east-1',
      credentials: fixtureCredentials,
    })
    const token = 'fixture-preview-lab-seed-'.padEnd(48, 'x')
    const runtimeKey = Symbol.for('magazine.owner-runtime')
    const runtimeGlobal = globalThis as typeof globalThis & { [runtimeKey]?: OwnerRuntime }

    function environment(overrides: Record<string, string | undefined> = {}) {
      const values: Record<string, string | undefined> = {
        NODE_ENV: 'production',
        MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'preview',
        VERCEL: '1',
        VERCEL_ENV: 'preview',
        VERCEL_TARGET_ENV: 'preview',
        MAGAZINE_LAB_SEED_TOKEN: token,
        DATABASE_URL: target.href,
        MAGAZINE_OWNER_TEST_MODE: undefined,
        MAGAZINE_MEDIA_BUCKET: bucket,
        MAGAZINE_MEDIA_REGION: 'us-east-1',
        MAGAZINE_MEDIA_ENDPOINT: s3Endpoint,
        MAGAZINE_MEDIA_ACCESS_KEY_ID: fixtureCredentials.accessKeyId,
        MAGAZINE_MEDIA_SECRET_ACCESS_KEY: fixtureCredentials.secretAccessKey,
        ...overrides,
      }
      for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value)
    }

    function request(authorization: string | null = `Bearer ${token}`) {
      return new Request('https://preview.example.invalid/api/internal/lab-seed', {
        method: 'POST',
        headers: authorization === null ? {} : { authorization },
      })
    }

    async function snapshot() {
      const repository = new PostgresContentRepository(pool)
      return repository.transaction(async (transaction) => ({
        articles: await transaction.listArticles(),
        revisions: await transaction.listRevisions(),
        media: await transaction.listMediaAssets(),
        sections: await transaction.listTaxonomyTerms(),
        assignments: await transaction.listArticleTaxonomies(),
        audits: await transaction.listAuditEvents(),
        outbox: await transaction.listOutboxEvents(),
        publicationVersion: await repository.readPublicationVersion(),
      }))
    }

    beforeAll(async () => {
      await admin.query(`CREATE SCHEMA "${schema}"`)
      await applyContentMigrations(pool, await readContentMigrations())
      await client.send(new CreateBucketCommand({ Bucket: bucket }))
    })
    beforeEach(() => {
      delete runtimeGlobal[runtimeKey]
      environment()
    })
    afterEach(async () => {
      await runtimeGlobal[runtimeKey]?.pool?.end()
      delete runtimeGlobal[runtimeKey]
      vi.unstubAllEnvs()
    })
    afterAll(async () => {
      client.destroy()
      await pool.end()
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await admin.end()
    })

    it('refuses every deployment veto and invalid token before runtime creation or database writes', async () => {
      const before = await snapshot()
      for (const scenario of refusedLabSeedEnvironments) {
        environment()
        for (const key of labSeedEnvironmentKeys) vi.stubEnv(key, scenario.environment[key])
        expect((await POST(request())).status, scenario.name).toBe(404)
        expect(runtimeGlobal[runtimeKey]).toBeUndefined()
      }
      for (const value of [undefined, '', 'short', 'x'.repeat(513)]) {
        environment({ MAGAZINE_LAB_SEED_TOKEN: value })
        expect((await POST(request())).status).toBe(404)
      }
      environment()
      for (const authorization of [
        null,
        'Bearer wrong',
        'Basic fixture',
        `Bearer ${'x'.repeat(513)}`,
      ]) {
        expect((await POST(request(authorization))).status).toBe(404)
      }
      expect(runtimeGlobal[runtimeKey]).toBeUndefined()
      expect(await snapshot()).toEqual(before)
    })

    it('keeps production fixture and missing-media refusals write-free', async () => {
      const before = await snapshot()
      environment({ MAGAZINE_OWNER_TEST_MODE: '1' })
      expect((await POST(request())).status).toBe(503)
      expect(runtimeGlobal[runtimeKey]).toBeUndefined()
      environment({ MAGAZINE_MEDIA_BUCKET: undefined, MAGAZINE_MEDIA_REGION: undefined })
      expect((await POST(request())).status).toBe(503)
      expect(await snapshot()).toEqual(before)
    })

    it(
      'uses production adapters, preserves owner collisions and edits, and never rewrites originals on replay',
      { timeout: 30_000 },
      async () => {
        const owner = getOwnerRuntime()
        expect(owner.repository).toBeInstanceOf(PostgresContentRepository)
        expect(owner.objects).toBeInstanceOf(S3OriginalObjectStore)
        const collision = labStories[0]!
        const id = 'article-fixture-owner'
        await owner.content.createArticle({
          id,
          title: 'Owner story',
          slug: labStorySlug(collision),
          dek: 'Owner words',
          idempotencyKey: 'fixture-owner-create',
          document: {
            articleId: id,
            title: 'Owner story',
            schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
            migrationProvenance: [],
            document: { type: 'doc', content: [{ type: 'paragraph' }] },
          },
        })
        const ownerBefore = await owner.repository.transaction(async (transaction) => ({
          article: await transaction.getArticle(id),
          revisions: await transaction.listRevisions(id),
        }))
        const response = await POST(request())
        expect(response.status).toBe(200)
        expect(response.headers.get('cache-control')).toBe('private, no-store')
        const report = await response.json()
        expect(report.stories.created).toHaveLength(7)
        expect(report.stories.slugInUse).toEqual([labStorySlug(collision)])
        expect(report.images.created).toHaveLength(labImages.length)
        expect(report.images.skipped).toBeNull()
        const home = await readHomeView({ mediaAvailable: true, repository: owner.repository })
        expect(home.recent.length + (home.lead ? 1 : 0)).toBe(7)
        const assets = await owner.repository.transaction((transaction) =>
          transaction.listMediaAssets(),
        )
        for (const asset of assets) {
          const bytes = await owner.objects!.getOriginal(asset.originalKey)
          expect(sha256Bytes(bytes)).toBe(asset.originalSha256)
          expect(Array.from(bytes.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
        }

        // Model owner changes after the first seed, including removal of a sample section.
        const editedId = labStories[1]!.id
        const current = await owner.repository.transaction((transaction) =>
          transaction.getArticle(editedId),
        )
        const saved = await owner.content.saveDraft({
          articleId: editedId,
          expectedVersion: current!.version,
          idempotencyKey: 'fixture-owner-edit',
          title: 'Edited by the owner',
          document: {
            articleId: editedId,
            title: 'Edited by the owner',
            schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
            migrationProvenance: [],
            document: {
              type: 'doc',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Keep this owner edit.' }] },
              ],
            },
          },
        })
        await owner.content.unpublish({
          articleId: editedId,
          expectedVersion: saved.article.version,
          idempotencyKey: 'fixture-owner-unpublish',
          reason: 'Owner choice',
        })
        await pool.query('DELETE FROM article_taxonomies WHERE article_id = $1', [editedId])
        const term = await owner.repository.transaction(
          async (transaction) => (await transaction.listTaxonomyTerms())[0]!,
        )
        // saveTaxonomyTerm inserts new terms; simulate this owner edit on the existing row.
        const renamed = await pool.query('UPDATE taxonomies SET name = $1 WHERE id = $2', [
          'Owner section name',
          term.id,
        ])
        expect(renamed.rowCount).toBe(1)
        await owner.repository.transaction(async (transaction) => {
          await transaction.saveMediaAsset({
            ...assets[0]!,
            alt: 'Owner alt text',
            caption: 'Owner caption',
          })
        })
        const beforeReplay = await snapshot()
        expect(beforeReplay.sections.find(({ id }) => id === term.id)).toEqual({
          ...term,
          name: 'Owner section name',
        })
        const put = vi.spyOn(owner.objects!, 'putOriginal')
        const replay = await POST(request())
        expect(replay.status).toBe(200)
        const repeated = await replay.json()
        expect(repeated.stories.created).toEqual([])
        expect(repeated.stories.existing).toHaveLength(7)
        expect(repeated.stories.slugInUse).toEqual([labStorySlug(collision)])
        expect(repeated.images.created).toEqual([])
        expect(put).not.toHaveBeenCalled()
        expect(await snapshot()).toEqual(beforeReplay)
        expect(
          await owner.repository.transaction(async (transaction) => ({
            article: await transaction.getArticle(id),
            revisions: await transaction.listRevisions(id),
          })),
        ).toEqual(ownerBefore)
      },
    )
  })
}
