import { passkey } from '@better-auth/passkey'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'

import { createContentDatabase } from '@/server/database/client'
import { ownerAuthSchema } from '@/server/database/schema'

import { OwnerConfigurationError, resolveOwnerAuthConfiguration } from './config'
import { getOwnerRuntime } from './runtime'

async function deliverRecoveryLink(input: {
  readonly email: string
  readonly url: string
}): Promise<void> {
  const configuration = resolveOwnerAuthConfiguration()
  if (input.email.toLowerCase() !== configuration.ownerEmail) return
  if (!configuration.recoveryWebhookUrl || !configuration.recoveryWebhookSecret) {
    throw new OwnerConfigurationError('Owner account recovery is not configured yet.')
  }
  const resetUrl = new URL(input.url)
  if (resetUrl.origin !== configuration.baseUrl.origin) {
    throw new OwnerConfigurationError('The generated recovery link has an unexpected origin.')
  }
  const response = await fetch(configuration.recoveryWebhookUrl, {
    body: JSON.stringify({ email: configuration.ownerEmail, resetUrl: resetUrl.toString() }),
    headers: {
      authorization: `Bearer ${configuration.recoveryWebhookSecret}`,
      'content-type': 'application/json',
    },
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error('The recovery message could not be delivered.')
}

function createOwnerAuth() {
  const configuration = resolveOwnerAuthConfiguration()
  const pool = getOwnerRuntime().pool
  if (!pool) throw new OwnerConfigurationError('Fixture content cannot back production auth.')
  const database = createContentDatabase(pool)
  return betterAuth({
    advanced: {
      cookiePrefix: 'magazine-owner',
      useSecureCookies: configuration.baseUrl.protocol === 'https:',
    },
    baseURL: configuration.baseUrl.toString(),
    database: drizzleAdapter(database, {
      provider: 'pg',
      schema: ownerAuthSchema,
      transaction: true,
    }),
    emailAndPassword: {
      disableSignUp: true,
      enabled: true,
      maxPasswordLength: 128,
      minPasswordLength: 14,
      resetPasswordTokenExpiresIn: 30 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => deliverRecoveryLink({ email: user.email, url }),
    },
    plugins: [
      passkey({
        origin: configuration.baseUrl.origin,
        rpID: configuration.baseUrl.hostname,
        rpName: 'Magazine owner workspace',
      }),
      nextCookies(),
    ],
    rateLimit: { enabled: true, max: 30, window: 60 },
    secret: configuration.secret,
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      freshAge: 60 * 60 * 24,
      updateAge: 60 * 60 * 12,
    },
    trustedOrigins: [configuration.baseUrl.origin],
  })
}

export type OwnerAuth = ReturnType<typeof createOwnerAuth>

const authSymbol = Symbol.for('magazine.owner-auth')
type AuthGlobal = typeof globalThis & { [authSymbol]?: OwnerAuth }

export function getOwnerAuth(): OwnerAuth {
  const authGlobal = globalThis as AuthGlobal
  authGlobal[authSymbol] ??= createOwnerAuth()
  return authGlobal[authSymbol]
}
