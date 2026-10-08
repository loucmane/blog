// Deliberately inconsistent deployment configurations must fail before any runtime access.
export const refusedLabSeedEnvironments: ReadonlyArray<{
  name: string
  environment: Record<string, string | undefined>
}> = [
  ...[undefined, '', 'production', 'staging', 'Preview', 'preview '].map((value) => ({
    name: `production runtime with declaration ${String(value)}`,
    environment: { NODE_ENV: 'production', MAGAZINE_DEPLOYMENT_ENVIRONMENT: value },
  })),
  ...['test', 'development'].map((value) => ({
    name: `production deployment in ${value} mode`,
    environment: { NODE_ENV: value, MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'production' },
  })),
  ...['VERCEL_ENV', 'VERCEL_TARGET_ENV'].flatMap((key) => [
    {
      name: `${key} production vetoes Preview declaration`,
      environment: {
        NODE_ENV: 'production',
        MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'preview',
        [key]: 'production',
      },
    },
    {
      name: `${key} production vetoes local mode`,
      environment: { NODE_ENV: 'test', [key]: 'production' },
    },
    {
      name: `${key} preview alone is insufficient`,
      environment: { NODE_ENV: 'test', [key]: 'preview' },
    },
    {
      name: `${key} unknown value vetoes Preview declaration`,
      environment: { MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'preview', [key]: 'unknown' },
    },
  ]),
  {
    name: 'Vercel host without explicit Preview intent',
    environment: { NODE_ENV: 'test', VERCEL: '1' },
  },
  {
    name: 'conflicting provider signals',
    environment: {
      MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'preview',
      VERCEL_ENV: 'production',
      VERCEL_TARGET_ENV: 'preview',
    },
  },
]

export const labSeedEnvironmentKeys = [
  'NODE_ENV',
  'MAGAZINE_DEPLOYMENT_ENVIRONMENT',
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_TARGET_ENV',
] as const
