import { createHash, timingSafeEqual } from 'node:crypto'

import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { Pool, PoolClient } from 'pg'

import {
  configuredSecretIsStrong,
  readBoundedJson,
  requestOriginMatches,
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

async function completionRecorded(client: PoolClient) {
  const result = await client.query<{ complete: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM idempotency_records
      WHERE operation = 'owner-setup' AND key = 'singleton'
        AND result->>'completed' = 'true'
    ) AS complete
  `)
  return result.rows[0]?.complete !== false
}

async function recordCompletion(client: PoolClient, reason: 'existing-auth-state' | 'created') {
  await client.query(
    `INSERT INTO idempotency_records (operation, key, result, created_at)
     VALUES ('owner-setup', 'singleton', jsonb_build_object('completed', true, 'reason', $1::text), now())
     ON CONFLICT (operation, key) DO UPDATE SET result = EXCLUDED.result`,
    [reason],
  )
}

async function setupComplete(client: PoolClient, protectCreation = false) {
  if (await completionRecorded(client)) return true
  if (protectCreation) {
    // These are Better Auth's real user/credential tables. Unlike an advisory lock, this
    // also excludes writers outside this endpoint. NOWAIT avoids lock-upgrade deadlocks.
    await client.query('LOCK TABLE owner_users, owner_accounts IN SHARE ROW EXCLUSIVE MODE NOWAIT')
    if (await completionRecorded(client)) return true
  }
  const result = await client.query<{ occupied: boolean }>(`
    SELECT EXISTS (SELECT 1 FROM owner_users) OR
      EXISTS (SELECT 1 FROM owner_accounts) AS occupied
  `)
  if (result.rows[0]?.occupied !== false) {
    // Persist an observation even if the external provisioner later removes a partial user.
    await recordCompletion(client, 'existing-auth-state')
    return true
  }
  return false
}

async function setupTransaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    // Bound marker contention as well as table-lock contention; failures release all locks.
    await client.query("SET LOCAL lock_timeout = '3s'")
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

export async function ownerSetupPageState(
  environment: OwnerEnvironment = process.env,
  pool?: Pool,
): Promise<{ readonly ready: boolean } | null> {
  const configuration = resolveOwnerSetupConfiguration(environment)
  if (!configuration) return null
  const database = pool ?? getOwnerRuntime().pool
  if (!database) return null
  return setupTransaction(database, async (client) => ({ ready: await setupComplete(client) }))
}

function reply(
  status: number,
  message: string,
  fields: { field?: 'password'; email?: string } = {},
) {
  return Response.json(
    { message, ...fields },
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

async function invalidAttempt(client: PoolClient) {
  // A single global bucket works across serverless instances, restarts and changing proxy IPs.
  // The fixed key bounds storage and the database clock controls the window.
  const attempts = await client.query<{ attempts: number }>(`
    INSERT INTO idempotency_records (operation, key, result, created_at)
    VALUES ('owner-setup', 'invalid-attempts', '{"attempts":1}', now())
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

  return reply(403, 'This setup link did not work. Ask the person helping you for a new link.')
}

async function attemptSetup(
  client: PoolClient,
  input: Record<string, unknown>,
  validToken: boolean,
  configuration: SetupConfiguration,
) {
  // Invalid traffic never takes the creation lock or consumes the valid link's allowance.
  if (await setupComplete(client, validToken)) return unavailable()
  if (!validToken) return invalidAttempt(client)
  if (input.action === 'verify') {
    return reply(200, 'Choose your password.', { email: configuration.ownerEmail })
  }
  if (input.action !== undefined && input.action !== 'create') {
    return reply(400, 'We could not read the form. Open your setup link and try again.')
  }
  const password = input.password
  if (typeof password !== 'string' || password.length < 14 || password.length > 128) {
    return reply(400, 'Use between 14 and 128 characters for your password.', { field: 'password' })
  }
  const result = await createOwner(client, configuration, password)
  if (!result.ok || result.headers.getSetCookie().length === 0) {
    throw new Error('Account setup did not complete.')
  }
  await recordCompletion(client, 'created')
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
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json'
  ) {
    return reply(415, 'We could not read the form. Open your setup link and try again.')
  }
  try {
    // Read the bounded body before acquiring the database lock, so a slow upload cannot hold it.
    const body = await readBoundedJson(request, 4096)
    if (!body.ok || !body.value || typeof body.value !== 'object' || Array.isArray(body.value)) {
      return reply(400, 'We could not read the form. Open your setup link and try again.')
    }
    const input = body.value as Record<string, unknown>
    const token = typeof input.token === 'string' ? input.token : ''
    const validToken = ownerSetupTokenMatches(token, configuration.setupToken)
    const database = pool ?? getOwnerRuntime().pool
    if (!database) return unavailable()
    return await setupTransaction(database, (client) =>
      attemptSetup(client, input, validToken, configuration),
    )
  } catch {
    // Never serialize or log a thrown dependency error: it can include request data.
    return reply(
      503,
      'We could not finish setup. Try again shortly. If your account was created, you can sign in.',
    )
  }
}
