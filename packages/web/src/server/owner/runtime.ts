import { S3Client } from '@aws-sdk/client-s3'
import { Pool } from 'pg'

import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore, MediaOriginalService } from '@/server/content/media'
import { InMemoryMediaVariantStore, MediaVariantService } from '@/server/content/media-variants'
import type {
  ContentRepository,
  MediaVariantStore,
  OriginalObjectStore,
} from '@/server/content/ports'
import { ContentService } from '@/server/content/service'
import { PostgresContentRepository } from '@/server/database/postgres-content-repository'
import { S3MediaVariantStore } from '@/server/database/s3-media-variant-store'
import { S3OriginalObjectStore } from '@/server/database/s3-original-object-store'

import {
  OwnerConfigurationError,
  resolveOwnerFixtureConfiguration,
  type OwnerEnvironment,
} from './config'
import { OwnerWorkspaceService } from './workspace'

export interface OwnerRuntime {
  readonly content: ContentService
  readonly media: MediaOriginalService | null
  readonly objects: OriginalObjectStore | null
  readonly pool: Pool | null
  readonly repository: ContentRepository
  /** Resized variants of public images; null when media storage is not configured. */
  readonly variants: MediaVariantService | null
  readonly workspace: OwnerWorkspaceService
}

interface MediaStorage {
  readonly objects: OriginalObjectStore
  readonly variants: MediaVariantStore
}

function optionalS3Media(environment: OwnerEnvironment): MediaStorage | null {
  const bucket = environment.MAGAZINE_MEDIA_BUCKET
  const region = environment.MAGAZINE_MEDIA_REGION
  if (!bucket && !region) return null
  if (!bucket || !region) {
    throw new OwnerConfigurationError('Media storage requires both bucket and region.')
  }
  const accessKeyId = environment.MAGAZINE_MEDIA_ACCESS_KEY_ID
  const secretAccessKey = environment.MAGAZINE_MEDIA_SECRET_ACCESS_KEY
  if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
    throw new OwnerConfigurationError('Media storage credentials must be configured as a pair.')
  }
  const client = new S3Client({
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    ...(environment.MAGAZINE_MEDIA_ENDPOINT
      ? { endpoint: environment.MAGAZINE_MEDIA_ENDPOINT, forcePathStyle: true }
      : {}),
    region,
  })
  return {
    objects: new S3OriginalObjectStore(client, bucket),
    variants: new S3MediaVariantStore(client, bucket),
  }
}

export function createOwnerRuntime(environment: OwnerEnvironment = process.env): OwnerRuntime {
  const fixture = resolveOwnerFixtureConfiguration(environment)
  let repository: ContentRepository
  let storage: MediaStorage | null
  let pool: Pool | null
  if (fixture) {
    repository = new InMemoryContentRepository()
    storage = {
      objects: new InMemoryOriginalObjectStore(),
      variants: new InMemoryMediaVariantStore(),
    }
    pool = null
  } else {
    const databaseUrl = environment.DATABASE_URL
    if (!databaseUrl || !/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
      throw new OwnerConfigurationError('The owner workspace requires PostgreSQL.')
    }
    pool = new Pool({ connectionString: databaseUrl, max: 8 })
    repository = new PostgresContentRepository(pool)
    storage = optionalS3Media(environment)
  }
  return {
    content: new ContentService(repository),
    media: storage ? new MediaOriginalService(repository, storage.objects) : null,
    objects: storage?.objects ?? null,
    pool,
    repository,
    variants: storage ? new MediaVariantService(storage.objects, storage.variants) : null,
    workspace: new OwnerWorkspaceService(repository),
  }
}

const runtimeSymbol = Symbol.for('magazine.owner-runtime')
type RuntimeGlobal = typeof globalThis & { [runtimeSymbol]?: OwnerRuntime }

export function getOwnerRuntime(): OwnerRuntime {
  const runtimeGlobal = globalThis as RuntimeGlobal
  runtimeGlobal[runtimeSymbol] ??= createOwnerRuntime()
  return runtimeGlobal[runtimeSymbol]
}
