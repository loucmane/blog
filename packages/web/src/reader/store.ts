import type { MediaVariantService } from '@/server/content/media-variants'
import type { OriginalObjectStore } from '@/server/content/ports'
import { OwnerConfigurationError } from '@/server/owner/config'
import { getOwnerRuntime } from '@/server/owner/runtime'

import type { ReaderSource } from './read-model'

export interface ReaderStore extends ReaderSource {
  readonly objects: OriginalObjectStore | null
  readonly variants: MediaVariantService | null
}

function isConfigurationError(error: unknown): boolean {
  return (
    error instanceof OwnerConfigurationError ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'owner_configuration')
  )
}

/**
 * The content store the application runtime selected: the in-memory store in owner test mode,
 * otherwise PostgreSQL. Returns null when neither is configured, for example in a production
 * smoke run without a database, so public pages can say the magazine is unavailable.
 */
export function resolveReaderStore(): ReaderStore | null {
  try {
    const runtime = getOwnerRuntime()
    return {
      mediaAvailable: runtime.objects !== null,
      objects: runtime.objects,
      repository: runtime.repository,
      variants: runtime.variants,
    }
  } catch (error) {
    if (isConfigurationError(error)) return null
    throw error
  }
}
