import { configuredSecretIsStrong } from '@/lib/request-security'

export type OwnerEnvironment = Readonly<Record<string, string | undefined>>

export class OwnerConfigurationError extends Error {
  readonly code = 'owner_configuration' as const

  constructor(message: string) {
    super(message)
    this.name = 'OwnerConfigurationError'
  }
}

export interface OwnerAuthConfiguration {
  readonly baseUrl: URL
  readonly databaseUrl: string
  readonly ownerEmail: string
  readonly ownerName: string
  readonly recoveryWebhookSecret: string | null
  readonly recoveryWebhookUrl: URL | null
  readonly secret: string
}

export interface OwnerFixtureConfiguration {
  readonly baseUrl: URL
  readonly ownerEmail: string
  readonly ownerName: string
  readonly token: string
}

function parseHttpUrl(value: string | undefined, label: string): URL {
  if (!value) throw new OwnerConfigurationError(`${label} is required.`)
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new OwnerConfigurationError(`${label} must be an absolute HTTP or HTTPS URL.`)
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    throw new OwnerConfigurationError(`${label} must be a plain HTTP or HTTPS origin.`)
  }
  return new URL(url.origin)
}

function ownerIdentity(environment: OwnerEnvironment) {
  const ownerEmail = environment.MAGAZINE_OWNER_EMAIL?.trim().toLowerCase()
  if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    throw new OwnerConfigurationError('MAGAZINE_OWNER_EMAIL must be a valid email address.')
  }
  const ownerName = environment.MAGAZINE_OWNER_NAME?.trim() || 'Magazine owner'
  if (ownerName.length > 120) {
    throw new OwnerConfigurationError('MAGAZINE_OWNER_NAME must be at most 120 characters.')
  }
  return { ownerEmail, ownerName }
}

function baseUrl(environment: OwnerEnvironment): URL {
  return parseHttpUrl(
    environment.BETTER_AUTH_URL ?? environment.MAGAZINE_RUNTIME_SITE_URL,
    'BETTER_AUTH_URL or MAGAZINE_RUNTIME_SITE_URL',
  )
}

function assertSecureOwnerOrigin(url: URL, environment: OwnerEnvironment): URL {
  if (url.protocol === 'https:') return url
  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  if (loopback && environment.NODE_ENV !== 'production') return url
  throw new OwnerConfigurationError(
    'The owner workspace requires HTTPS outside an explicit local development or test origin.',
  )
}

export function resolveOwnerAuthConfiguration(
  environment: OwnerEnvironment = process.env,
): OwnerAuthConfiguration {
  const databaseUrl = environment.DATABASE_URL
  if (!databaseUrl || !/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
    throw new OwnerConfigurationError('DATABASE_URL must use PostgreSQL for owner authentication.')
  }
  const secret = environment.BETTER_AUTH_SECRET
  if (!configuredSecretIsStrong(secret)) {
    throw new OwnerConfigurationError('BETTER_AUTH_SECRET must contain at least 32 bytes.')
  }
  const identity = ownerIdentity(environment)
  const recoveryWebhookUrl = environment.MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL
    ? parseHttpUrl(environment.MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL, 'Recovery webhook URL')
    : null
  if (recoveryWebhookUrl && recoveryWebhookUrl.protocol !== 'https:') {
    throw new OwnerConfigurationError('The owner recovery webhook must use HTTPS.')
  }
  const recoveryWebhookSecret = environment.MAGAZINE_OWNER_RECOVERY_WEBHOOK_SECRET ?? null
  if (recoveryWebhookUrl && !configuredSecretIsStrong(recoveryWebhookSecret ?? undefined)) {
    throw new OwnerConfigurationError(
      'The owner recovery webhook requires a secret containing at least 32 bytes.',
    )
  }
  return {
    baseUrl: assertSecureOwnerOrigin(baseUrl(environment), environment),
    databaseUrl,
    ...identity,
    recoveryWebhookSecret,
    recoveryWebhookUrl,
    secret,
  }
}

export function resolveOwnerFixtureConfiguration(
  environment: OwnerEnvironment = process.env,
): OwnerFixtureConfiguration | null {
  if (environment.MAGAZINE_OWNER_TEST_MODE !== '1') return null
  if (environment.NODE_ENV !== 'test') {
    throw new OwnerConfigurationError(
      'Owner test mode is available only in an explicit test runtime.',
    )
  }
  const resolvedBaseUrl = baseUrl(environment)
  if (!['127.0.0.1', 'localhost'].includes(resolvedBaseUrl.hostname)) {
    throw new OwnerConfigurationError('Owner test mode is restricted to a local loopback origin.')
  }
  const token = environment.MAGAZINE_OWNER_TEST_TOKEN
  if (!configuredSecretIsStrong(token)) {
    throw new OwnerConfigurationError('Owner test mode requires a strong fixture token.')
  }
  return { baseUrl: resolvedBaseUrl, ...ownerIdentity(environment), token }
}

export function resolveOwnerTimeZone(environment: OwnerEnvironment = process.env): string {
  return environment.MAGAZINE_OWNER_TIME_ZONE?.trim() || 'Europe/Stockholm'
}

export function resolvePublicationWorkerToken(environment: OwnerEnvironment = process.env): string {
  const token = environment.MAGAZINE_PUBLICATION_WORKER_TOKEN
  if (!configuredSecretIsStrong(token)) {
    throw new OwnerConfigurationError(
      'MAGAZINE_PUBLICATION_WORKER_TOKEN must contain at least 32 bytes.',
    )
  }
  return token
}
