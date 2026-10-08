// One-shot seed for a running local lab or explicitly configured hosted Preview.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { labSeedAllowed } from '../src/server/lab/environment.mjs'

export async function runLabSeed({ environment = process.env, fetcher = fetch } = {}) {
  if (!labSeedAllowed(environment)) {
    throw new Error(
      'lab:seed requires MAGAZINE_DEPLOYMENT_ENVIRONMENT=preview for hosted runtimes and refuses production deployment signals.',
    )
  }
  const token = environment.MAGAZINE_LAB_SEED_TOKEN
  if (
    !token ||
    !/^\S+$/.test(token) ||
    Buffer.byteLength(token, 'utf8') < 32 ||
    Buffer.byteLength(token, 'utf8') > 512
  ) {
    throw new Error(
      'Set MAGAZINE_LAB_SEED_TOKEN (32–512 bytes, no whitespace) for both the server and this command.',
    )
  }
  let origin
  try {
    origin = new URL(
      environment.MAGAZINE_LAB_SEED_URL ??
        environment.MAGAZINE_RUNTIME_SITE_URL ??
        'http://localhost:3000',
    )
  } catch {
    throw new Error('MAGAZINE_LAB_SEED_URL must be a plain HTTP or HTTPS origin.')
  }
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== '/'
  ) {
    throw new Error(
      'MAGAZINE_LAB_SEED_URL must be a plain HTTP or HTTPS origin without credentials, path, query or fragment.',
    )
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
  if (
    !loopback &&
    (origin.protocol !== 'https:' || environment.MAGAZINE_DEPLOYMENT_ENVIRONMENT !== 'preview')
  ) {
    throw new Error('A remote lab seed requires HTTPS and MAGAZINE_DEPLOYMENT_ENVIRONMENT=preview.')
  }

  let response
  try {
    response = await fetcher(new URL('/api/internal/lab-seed', origin), {
      headers: { authorization: `Bearer ${token}` },
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(120_000),
    })
  } catch {
    throw new Error(
      'Could not complete the lab seed request. Check the URL, server availability and deployment protection; redirects are refused. Inspect the Preview before retrying.',
    )
  }
  if (!response.ok) {
    throw new Error(
      `The server refused the lab seed (HTTP ${response.status}). Check the server's Preview declaration, seed token and PostgreSQL/media configuration.`,
    )
  }
  try {
    return await response.json()
  } catch {
    throw new Error(
      'The server did not return a lab seed report. Inspect the Preview before retrying.',
    )
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runLabSeed().then(
    (report) => console.log(JSON.stringify(report, null, 2)),
    (error) => {
      console.error(error.message)
      process.exitCode = 1
    },
  )
}
