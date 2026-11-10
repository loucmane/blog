import { z } from 'zod'

import { readBoundedJson } from '@/lib/request-security'
import { observeRequest } from '../observability/request'
import { assertOwnerMutationRequest, ownerErrorResponse } from '../owner/api'
import { OwnerConfigurationError } from '../owner/config'
import { requireOwnerSession } from '../owner/session'
import { OwnerSubscriberOperations, SubscriberInputError } from './owner-operations'
import { getSubscriptionRuntime } from './runtime'

const privateHeaders = {
  'cache-control': 'private, no-store',
  'x-robots-tag': 'noindex, nofollow, noarchive',
}
const inputSchema = z
  .object({ email: z.string().max(254), confirmation: z.string().max(254).optional() })
  .strict()
const maxInputBytes = 4096

/** Native forms and JSON share strict fields and a streaming byte bound. */
async function readInput(request: Request) {
  const type = request.headers.get('content-type')?.split(';', 1)[0]?.trim()
  if (type === 'application/json') {
    const input = await readBoundedJson(request, maxInputBytes)
    return input.ok ? inputSchema.parse(input.value) : inputSchema.parse(null)
  }
  if (type !== 'application/x-www-form-urlencoded' || !request.body) return inputSchema.parse(null)
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxInputBytes) {
        await reader.cancel()
        return inputSchema.parse(null)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
  const fields: Record<string, string> = {}
  for (const [key, value] of form) {
    if (Object.hasOwn(fields, key)) return inputSchema.parse(null)
    Object.defineProperty(fields, key, { value, enumerable: true })
  }
  return inputSchema.parse(fields)
}

export function subscriberRoute(request: Request, operation: 'summary' | 'export' | 'erase') {
  return observeRequest(request, async ({ logger, recordFailure }) => {
    const isForm =
      request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded') ?? false
    const redirect = (result: string) =>
      new Response(null, {
        status: 303,
        headers: {
          ...privateHeaders,
          location: `/owner/subscribers?result=${encodeURIComponent(result)}`,
        },
      })
    try {
      await requireOwnerSession(request.headers)
      if (operation !== 'summary') assertOwnerMutationRequest(request)
      const runtime = getSubscriptionRuntime()
      if (!runtime) throw new OwnerConfigurationError('Subscriptions are not configured.')
      const operations = new OwnerSubscriberOperations(runtime.store, logger)
      if (operation === 'summary')
        return Response.json(await operations.summary(), { headers: privateHeaders })
      const input = await readInput(request)
      if (operation === 'export') {
        const bundle = await operations.exportSubscriber(input.email)
        if (!bundle)
          return isForm
            ? redirect('export-not-found')
            : Response.json({ status: 'not-found' }, { headers: privateHeaders, status: 404 })
        return Response.json(bundle, {
          headers: {
            ...privateHeaders,
            'content-disposition': 'attachment; filename="subscriber.json"',
          },
        })
      }
      const status = await operations.eraseSubscriber(input.email, input.confirmation)
      return isForm ? redirect(status) : Response.json({ status }, { headers: privateHeaders })
    } catch (error) {
      if (error instanceof SubscriberInputError || error instanceof z.ZodError) {
        const reason = error instanceof SubscriberInputError ? error.reason : 'invalid-address'
        return isForm
          ? redirect(reason)
          : Response.json({ error: reason }, { headers: privateHeaders, status: 422 })
      }
      const response = ownerErrorResponse(error)
      if (response.status >= 500) recordFailure(error)
      if (isForm && response.status >= 500) return redirect('unavailable')
      for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value)
      return response
    }
  })
}
