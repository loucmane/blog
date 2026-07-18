export type ContentBackendSelection =
  | { readonly connectionString: string; readonly kind: 'postgres' }
  | { readonly kind: 'framework-fixture' }

export class ContentBackendConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentBackendConfigurationError'
  }
}

export function selectContentBackend(input: {
  readonly databaseUrl?: string
  readonly mode?: string
  readonly nodeEnv: string
}): ContentBackendSelection {
  if (input.mode === 'framework-fixture') {
    if (input.nodeEnv === 'production') {
      throw new ContentBackendConfigurationError(
        'The framework fixture is not a production content backend.',
      )
    }
    return { kind: 'framework-fixture' }
  }
  if (input.mode !== undefined && input.mode !== 'postgres') {
    throw new ContentBackendConfigurationError(`Unknown content backend ${input.mode}.`)
  }
  if (
    input.databaseUrl?.startsWith('postgresql://') ||
    input.databaseUrl?.startsWith('postgres://')
  ) {
    return { connectionString: input.databaseUrl, kind: 'postgres' }
  }
  throw new ContentBackendConfigurationError(
    'PostgreSQL configuration is required; the fixture will not activate implicitly.',
  )
}
