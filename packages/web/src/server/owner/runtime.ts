import { S3Client } from '@aws-sdk/client-s3'
import { Pool } from 'pg'

import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore, MediaOriginalService } from '@/server/content/media'
import type { ContentRepository, OriginalObjectStore } from '@/server/content/ports'
import { ContentService } from '@/server/content/service'
import { PostgresContentRepository } from '@/server/database/postgres-content-repository'
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
  readonly workspace: OwnerWorkspaceService
}

function optionalS3Objects(environment: OwnerEnvironment): OriginalObjectStore | null {
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
  return new S3OriginalObjectStore(client, bucket)
}

export function createOwnerRuntime(environment: OwnerEnvironment = process.env): OwnerRuntime {
  const fixture = resolveOwnerFixtureConfiguration(environment)
  let repository: ContentRepository
  let objects: OriginalObjectStore | null
  let pool: Pool | null
  if (fixture) {
    repository = new InMemoryContentRepository()
    objects = new InMemoryOriginalObjectStore()
    pool = null
  } else {
    const databaseUrl = environment.DATABASE_URL
    if (!databaseUrl || !/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
      throw new OwnerConfigurationError('The owner workspace requires PostgreSQL.')
    }
    pool = new Pool({ connectionString: databaseUrl, max: 8 })
    repository = new PostgresContentRepository(pool)
    objects = optionalS3Objects(environment)
  }
  return {
    content: new ContentService(repository),
    media: objects ? new MediaOriginalService(repository, objects) : null,
    objects,
    pool,
    repository,
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
