import { z } from 'zod'

import { MAX_CONTENT_DOCUMENT_BYTES } from '@/server/content/document'

export const ownerRecoveryLifetimeMilliseconds = 7 * 24 * 60 * 60 * 1_000
export const ownerRecoveryStoragePrefix = 'magazine-owner-recovery:v1:'

const recoverySchema = z
  .object({
    articleId: z.string().min(1).max(160),
    baseVersion: z.number().int().positive(),
    dek: z.string().max(2_000),
    document: z.unknown(),
    savedAt: z.string().datetime({ offset: true }),
    title: z.string().max(300),
  })
  .strict()

export type OwnerRecoveryDraft = z.infer<typeof recoverySchema>

export function ownerRecoveryKey(articleId: string): string {
  return `${ownerRecoveryStoragePrefix}${articleId}`
}

export function serializeOwnerRecovery(draft: OwnerRecoveryDraft): string {
  const value = recoverySchema.parse(draft)
  const serialized = JSON.stringify(value)
  if (new TextEncoder().encode(serialized).byteLength > MAX_CONTENT_DOCUMENT_BYTES) {
    throw new Error('This local recovery copy is too large to store safely.')
  }
  return serialized
}

export function parseOwnerRecovery(
  value: string | null,
  now = Date.now(),
): OwnerRecoveryDraft | null {
  if (!value) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }
  const result = recoverySchema.safeParse(parsed)
  if (!result.success) return null
  const savedAt = Date.parse(result.data.savedAt)
  if (!Number.isFinite(savedAt) || savedAt > now + 5 * 60_000) return null
  if (now - savedAt > ownerRecoveryLifetimeMilliseconds) return null
  return result.data
}

export function recoveryIsNewer(recovery: OwnerRecoveryDraft, serverUpdatedAt: string): boolean {
  return Date.parse(recovery.savedAt) > Date.parse(serverUpdatedAt)
}
