import path from 'node:path'

import { canonicalJson, type PortableContentBundle } from './portability'

export interface DatabaseCommandPlan {
  readonly args: readonly string[]
  readonly command: 'pg_dump' | 'pg_restore'
  readonly databaseUrlEnvironmentKey: 'DATABASE_URL'
}

function requireAbsolutePath(value: string, label: string): string {
  if (!path.isAbsolute(value)) throw new Error(`${label} must be an absolute path.`)
  return path.normalize(value)
}

export function buildLogicalBackupPlan(outputFile: string): DatabaseCommandPlan {
  return {
    args: [
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      '--file',
      requireAbsolutePath(outputFile, 'Backup output'),
    ],
    command: 'pg_dump',
    databaseUrlEnvironmentKey: 'DATABASE_URL',
  }
}

export function buildLogicalRestorePlan(inputFile: string): DatabaseCommandPlan {
  return {
    args: [
      '--exit-on-error',
      '--no-owner',
      '--no-privileges',
      requireAbsolutePath(inputFile, 'Restore input'),
    ],
    command: 'pg_restore',
    databaseUrlEnvironmentKey: 'DATABASE_URL',
  }
}

function recoveryFingerprint(bundle: PortableContentBundle): string {
  return canonicalJson({ data: bundle.data, media: bundle.media })
}

export interface RestoreVerificationReport {
  readonly expectedCounts: Readonly<Record<string, number>>
  readonly failedMedia: readonly string[]
  readonly restoredCounts: Readonly<Record<string, number>>
  readonly status: 'failed' | 'passed'
}

function counts(bundle: PortableContentBundle): Readonly<Record<string, number>> {
  return {
    articles: bundle.data.articles.length,
    auditEvents: bundle.data.auditEvents.length,
    authors: bundle.data.authors.length,
    mediaAssets: bundle.data.mediaAssets.length,
    mediaRenditions: bundle.data.mediaRenditions.length,
    publicationJobs: bundle.data.publicationJobs.length,
    redirects: bundle.data.redirects.length,
    revisions: bundle.data.revisions.length,
    taxonomies: bundle.data.taxonomies.length,
  }
}

export function verifyRestoredContent(input: {
  readonly expected: PortableContentBundle
  readonly failedMedia: readonly string[]
  readonly restored: PortableContentBundle
}): RestoreVerificationReport {
  const expectedCounts = counts(input.expected)
  const restoredCounts = counts(input.restored)
  const status =
    input.failedMedia.length === 0 &&
    recoveryFingerprint(input.expected) === recoveryFingerprint(input.restored)
      ? 'passed'
      : 'failed'
  return { expectedCounts, failedMedia: input.failedMedia, restoredCounts, status }
}
