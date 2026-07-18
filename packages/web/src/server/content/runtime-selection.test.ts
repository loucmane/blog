import { describe, expect, it } from 'vitest'

import { ContentBackendConfigurationError, selectContentBackend } from './runtime-selection'

describe('content runtime selection', () => {
  it('selects PostgreSQL explicitly and never falls back after missing configuration', () => {
    expect(
      selectContentBackend({
        databaseUrl: 'postgresql://magazine.invalid/content',
        nodeEnv: 'production',
      }),
    ).toEqual({
      connectionString: 'postgresql://magazine.invalid/content',
      kind: 'postgres',
    })
    expect(() => selectContentBackend({ nodeEnv: 'production' })).toThrow(
      ContentBackendConfigurationError,
    )
  })

  it('permits the named fixture only outside production', () => {
    expect(selectContentBackend({ mode: 'framework-fixture', nodeEnv: 'test' })).toEqual({
      kind: 'framework-fixture',
    })
    expect(() =>
      selectContentBackend({ mode: 'framework-fixture', nodeEnv: 'production' }),
    ).toThrow(/not a production content backend/)
  })

  it('rejects unknown modes and malformed database URLs', () => {
    expect(() => selectContentBackend({ mode: 'external-cms', nodeEnv: 'test' })).toThrow(
      /Unknown content backend/,
    )
    expect(() =>
      selectContentBackend({ databaseUrl: 'https://database.invalid', nodeEnv: 'production' }),
    ).toThrow(/PostgreSQL configuration is required/)
  })
})
