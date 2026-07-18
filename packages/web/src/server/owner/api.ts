import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { infer as ZodInfer, ZodType } from 'zod'

import { requestOriginMatches, readBoundedJson } from '@/lib/request-security'
import { resolveRuntimeSiteUrl } from '@/lib/site-url'
import {
  contentErrorCode,
  ContentConflictError,
  ContentNotFoundError,
  DuplicateSlugError,
  InvalidContentTransitionError,
} from '@/server/content/errors'
import { ContentDocumentValidationError } from '@/server/content/document'

import { OwnerAccessError, requireOwnerSession, type OwnerSession } from './session'
import { OwnerConfigurationError } from './config'

export const maxOwnerJsonBytes = 2_100_000

export async function readOwnerJson<T extends ZodType>(
  request: Request,
  schema: T,
): Promise<ZodInfer<T>> {
  if (request.headers.get('content-type')?.split(';', 1)[0] !== 'application/json') {
    throw new InvalidContentTransitionError('This request must use JSON.')
  }
  const parsed = await readBoundedJson(request, maxOwnerJsonBytes)
  if (!parsed.ok) {
    throw new InvalidContentTransitionError(
      parsed.reason === 'too-large'
        ? 'This story is too large to save.'
        : 'This request is not valid.',
    )
  }
  const result = schema.safeParse(parsed.value)
  if (!result.success) {
    throw new InvalidContentTransitionError(result.error.issues[0]?.message ?? 'Check the form.')
  }
  return result.data
}

export function assertOwnerMutationRequest(request: Request): void {
  const siteUrl = resolveRuntimeSiteUrl()
  if (
    !requestOriginMatches(
      request.headers.get('origin'),
      siteUrl,
      request.headers.get('sec-fetch-site'),
    )
  ) {
    throw new OwnerAccessError()
  }
}

export async function withOwner<T>(
  request: Request,
  operation: (owner: OwnerSession) => Promise<T>,
): Promise<NextResponse> {
  try {
    const owner = await requireOwnerSession(request.headers)
    return NextResponse.json(await operation(owner), {
      headers: { 'cache-control': 'private, no-store' },
    })
  } catch (error) {
    return ownerErrorResponse(error)
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
    ? error.message
    : fallback
}

export function ownerErrorResponse(error: unknown): NextResponse {
  const headers = { 'cache-control': 'private, no-store' }
  const contentCode = contentErrorCode(error)
  if (error instanceof OwnerAccessError) {
    return NextResponse.json({ error: error.message }, { headers, status: 401 })
  }
  if (error instanceof ContentNotFoundError || contentCode === 'content_not_found') {
    return NextResponse.json({ error: 'That item could not be found.' }, { headers, status: 404 })
  }
  if (error instanceof ContentConflictError || contentCode === 'content_conflict') {
    const conflict = error as ContentConflictError
    return NextResponse.json(
      {
        conflict: {
          article: conflict.currentArticle,
          currentRevision: conflict.currentRevision,
        },
        error: conflict.message,
      },
      { headers, status: 409 },
    )
  }
  if (
    error instanceof InvalidContentTransitionError ||
    error instanceof ContentDocumentValidationError ||
    error instanceof DuplicateSlugError ||
    contentCode === 'invalid_content_transition' ||
    contentCode === 'content_document_invalid' ||
    contentCode === 'duplicate_slug' ||
    error instanceof ZodError
  ) {
    return NextResponse.json(
      { error: errorMessage(error, 'Check the form and try again.') },
      { headers, status: 422 },
    )
  }
  if (
    error instanceof OwnerConfigurationError ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'owner_configuration')
  ) {
    return NextResponse.json(
      { error: 'The owner workspace is not configured yet.' },
      { headers, status: 503 },
    )
  }
  return NextResponse.json(
    { error: 'Something unexpected happened. Your local recovery copy is still available.' },
    { headers, status: 500 },
  )
}
