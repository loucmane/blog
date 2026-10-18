import { z } from 'zod'

import type { StoreMediaOriginalInput } from '@/server/content/media'

const safeId = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
const idempotencyKey = z.string().trim().min(8).max(200)
const title = z.string().trim().min(1, 'Add a title so this story is easy to find.').max(300)
const dek = z.string().max(2_000)

export const createOwnerStorySchema = z
  .object({
    dek,
    document: z.unknown(),
    idempotencyKey,
    title,
  })
  .strict()

export const saveOwnerStorySchema = z
  .object({
    dek,
    document: z.unknown(),
    expectedVersion: z.number().int().positive(),
    idempotencyKey,
    title,
  })
  .strict()

const versionedAction = z.object({
  expectedVersion: z.number().int().positive(),
  idempotencyKey,
})

export const ownerStoryActionSchema = z.discriminatedUnion('action', [
  versionedAction.extend({ action: z.literal('publish'), revisionId: safeId }).strict(),
  versionedAction
    .extend({
      action: z.literal('schedule'),
      localDateTime: z.string().max(32),
      revisionId: safeId,
      timeZone: z.string().min(1).max(100),
    })
    .strict(),
  versionedAction
    .extend({
      action: z.literal('unpublish'),
      reason: z
        .string()
        .trim()
        .min(1, 'Add a brief reason before unpublishing this story.')
        .max(1_000),
    })
    .strict(),
  versionedAction.extend({ action: z.literal('cancel-schedule') }).strict(),
  versionedAction.extend({ action: z.literal('delete') }).strict(),
  versionedAction.extend({ action: z.literal('restore') }).strict(),
  versionedAction.extend({ action: z.literal('restore-revision'), revisionId: safeId }).strict(),
])

const focalPointMessage = 'The focal point must be a number from 0 to 1.'

/** One focal point coordinate, sent by the upload form as text; the centre when it is missing. */
const focalCoordinate = z
  .string({ error: focalPointMessage })
  .trim()
  // A blank field would otherwise be read as 0, the edge of the image.
  .min(1, focalPointMessage)
  .pipe(
    z.coerce
      .number<string>({ error: focalPointMessage })
      .min(0, focalPointMessage)
      .max(1, focalPointMessage),
  )
  .default(0.5)

export const ownerMediaMetadataSchema = z
  .object({
    alt: z.string().trim().min(1, 'Describe the image for readers who cannot see it.').max(1_000),
    caption: z.string().trim().max(2_000).default(''),
    creditName: z.string().trim().min(1, 'Add the image credit.').max(300),
    creditUrl: z.union([z.literal(''), z.string().url().max(2_000)]).default(''),
    focalX: focalCoordinate,
    focalY: focalCoordinate,
  })
  .strict()
  // The form sends the focal point as two fields; the media store takes it as one point.
  .transform(
    ({ focalX, focalY, ...metadata }) =>
      ({
        ...metadata,
        focalPoint: { x: focalX, y: focalY },
      }) satisfies Partial<StoreMediaOriginalInput>,
  )
