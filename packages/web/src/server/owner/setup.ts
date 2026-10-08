import { createHash, timingSafeEqual } from 'node:crypto'

import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { Pool, PoolClient } from 'pg'

import {
  configuredSecretIsStrong,
  readBoundedJson,
  requestOriginMatches,
  type BoundedJsonResult,
} from '@/lib/request-security'
import { ownerAuthSchema } from '@/server/database/schema'

import { ownerAuthOptions } from './auth'
import {
  resolveOwnerAuthConfiguration,
  type OwnerAuthConfiguration,
  type OwnerEnvironment,
} from './config'
import { getOwnerRuntime } from './runtime'

interface SetupConfiguration extends OwnerAuthConfiguration {
  readonly setupToken: string
}

export function resolveOwnerSetupConfiguration(
  environment: OwnerEnvironment = process.env,
): SetupConfiguration | null {
  if (
    environment.MAGAZINE_OWNER_TEST_MODE === '1' ||
    environment.MAGAZINE_CONTENT_BACKEND === 'framework-fixture' ||
    !configuredSecretIsStrong(environment.MAGAZINE_OWNER_SETUP_TOKEN)
  )
    return null
  try {
    return {
      ...resolveOwnerAuthConfiguration(environment),
      setupToken: environment.MAGAZINE_OWNER_SETUP_TOKEN,
    }
  } catch {
    return null
  }
}

// Compare fixed-length digests, including missing and differently sized input. Never put the
// secret into SQL parameters, error messages, cookies, or the Better Auth request context.
export function ownerSetupTokenMatches(provided: string, expected: string): boolean {
  return timingSafeEqual(
    createHash('sha256').update(provided).digest(),
    createHash('sha256').update(expected).digest(),
  )
}

async function setupComplete(database: Pick<Pool, 'query'> | Pick<PoolClient, 'query'>) {
  const result = await database.query<{ complete: boolean }>(`
    SELECT EXISTS (SELECT 1 FROM owner_users) OR EXISTS (
      SELECT 1 FROM idempotency_records
      WHERE operation = 'owner-setup' AND key = 'singleton'
        AND result->>'completed' = 'true'
    ) AS complete
  `)
  return result.rows[0]?.complete !== false
}

export async function ownerSetupPageState(
  environment: OwnerEnvironment = process.env,
  pool?: Pool,
): Promise<{ readonly email: string; readonly ready: boolean } | null> {
  const configuration = resolveOwnerSetupConfiguration(environment)
  if (!configuration) return null
  const database = pool ?? getOwnerRuntime().pool
  if (!database) return null
  return { email: configuration.ownerEmail, ready: await setupComplete(database) }
}

function reply(status: number, message: string, field?: 'password') {
  return Response.json(
    { message, ...(field ? { field } : {}) },
    {
      status,
      headers: {
        'cache-control': 'private, no-store',
        'referrer-policy': 'no-referrer',
        'x-robots-tag': 'noindex, nofollow, noarchive',
        ...(status === 429 ? { 'retry-after': '900' } : {}),
      },
    },
  )
}

function unavailable() {
  return reply(404, 'Account setup is unavailable. If you already have an account, sign in.')
}

// This private auth instance is never exposed through the catch-all auth route. It uses the
// caller's transaction connection: user, credential, session, and completion commit together.
async function createOwner(
  client: PoolClient,
  configuration: SetupConfiguration,
  password: string,
) {
  const options = ownerAuthOptions(
    configuration,
    drizzleAdapter(drizzle(client), {
      provider: 'pg',
      schema: ownerAuthSchema,
      transaction: false,
    }),
  )
  const auth = betterAuth({
    ...options,
    emailAndPassword: { ...options.emailAndPassword, disableSignUp: false },
    // Do not let nextCookies send a session before the database commits.
    plugins: [],
    logger: { disabled: true },
  })
  return auth.api.signUpEmail({
    asResponse: true,
    body: { email: configuration.ownerEmail, name: configuration.ownerName, password },
  })
}

async function attemptSetup(
  client: PoolClient,
  body: BoundedJsonResult,
  configuration: SetupConfiguration,
) {
  const lock = await client.query<{ locked: boolean }>(
    'SELECT pg_try_advisory_xact_lock(170224, 16) AS locked',
  )
  if (!lock.rows[0]?.locked) return reply(429, 'Setup is busy. Please try again in 15 minutes.')
  if (await setupComplete(client)) return unavailable()

  // A single global bucket works across serverless instances, restarts and changing proxy IPs.
  // The fixed key bounds storage and the database clock controls the window.
  const attempts = await client.query<{ attempts: number }>(`
    INSERT INTO idempotency_records (operation, key, result, created_at)
    VALUES ('owner-setup', 'singleton', '{"attempts":1}', now())
    ON CONFLICT (operation, key) DO UPDATE SET
      result = CASE WHEN idempotency_records.created_at <= now() - interval '15 minutes'
        THEN '{"attempts":1}'::jsonb
        ELSE jsonb_build_object('attempts', LEAST(6, (idempotency_records.result->>'attempts')::int + 1)) END,
      created_at = CASE WHEN idempotency_records.created_at <= now() - interval '15 minutes'
        THEN now() ELSE idempotency_records.created_at END
    RETURNING (result->>'attempts')::int AS attempts
  `)
  if ((attempts.rows[0]?.attempts ?? 6) > 5) {
    return reply(429, 'Too many attempts. Please wait 15 minutes, then open your setup link again.')
  }

  if (!body.ok || !body.value || typeof body.value !== 'object') {
    return reply(400, 'We could not read the form. Open your setup link and try again.')
  }
  const input = body.value as Record<string, unknown>
  const token = typeof input.token === 'string' ? input.token : ''
  if (!ownerSetupTokenMatches(token, configuration.setupToken)) {
    return reply(403, 'This setup link did not work. Ask the person helping you for a new link.')
  }
  const password = input.password
  if (typeof password !== 'string' || password.length < 14 || password.length > 128) {
    return reply(400, 'Use between 14 and 128 characters for your password.', 'password')
  }
  const result = await createOwner(client, configuration, password)
  if (!result.ok || result.headers.getSetCookie().length === 0) {
    throw new Error('Account setup did not complete.')
  }
  await client.query(`
    UPDATE idempotency_records SET result = '{"completed":true}'
    WHERE operation = 'owner-setup' AND key = 'singleton'
  `)
  const response = reply(200, 'Your account is ready.')
  for (const cookie of result.headers.getSetCookie()) response.headers.append('set-cookie', cookie)
  return response
}

export async function handleOwnerSetup(
  request: Request,
  environment: OwnerEnvironment = process.env,
  pool?: Pool,
): Promise<Response> {
  const configuration = resolveOwnerSetupConfiguration(environment)
  if (!configuration) return unavailable()
  if (
    !requestOriginMatches(
      request.headers.get('origin'),
      configuration.baseUrl,
      request.headers.get('sec-fetch-site'),
    )
  ) {
    return reply(403, 'Open your setup link in this browser and try again.')
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return reply(415, 'We could not read the form. Open your setup link and try again.')
  }
  let client: PoolClient | undefined
  try {
    // Read the bounded body before acquiring the database lock, so a slow upload cannot hold it.
    const body = await readBoundedJson(request, 4096)
    const database = pool ?? getOwnerRuntime().pool
    if (!database) return unavailable()
    client = await database.connect()
    await client.query('BEGIN')
    const response = await attemptSetup(client, body, configuration)
    await client.query('COMMIT')
    return response
  } catch {
    await client?.query('ROLLBACK').catch(() => undefined)
    // Never serialize or log a thrown dependency error: it can include request data.
    return reply(
      503,
      'We could not finish setup. Try again shortly. If your account was created, you can sign in.',
    )
  } finally {
    client?.release()
  }
}
