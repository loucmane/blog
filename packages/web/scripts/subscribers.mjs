import { readFileSync, existsSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
const usage =
  'Usage: subscribers:summary | subscribers:export | subscribers:erase. Export reads {"email":"..."} from stdin; erase reads {"email":"...","confirmation":"..."}. DATABASE_URL supplies host database access.'

// The host command runs the same TypeScript modules as the server. Resolve only this
// application's aliases/extensionless imports; leave dependencies to Node's loader.
export function registerApplicationModules() {
  return registerHooks({
    resolve(specifier, context, nextResolve) {
      let candidate
      if (specifier.startsWith('@/')) candidate = path.join(sourceRoot, specifier.slice(2))
      else if (
        specifier.startsWith('.') &&
        context.parentURL?.startsWith(pathToFileURL(sourceRoot).href)
      ) {
        candidate = fileURLToPath(new URL(specifier, context.parentURL))
      }
      if (candidate && !path.extname(candidate) && existsSync(`${candidate}.ts`)) {
        return nextResolve(pathToFileURL(`${candidate}.ts`).href, context)
      }
      return nextResolve(specifier, context)
    },
    load(url, context, nextLoad) {
      if (url.startsWith(pathToFileURL(sourceRoot).href) && url.endsWith('.ts')) {
        return {
          format: 'module',
          shortCircuit: true,
          source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8'), { mode: 'transform' }),
        }
      }
      return nextLoad(url, context)
    },
  })
}

async function stdinInput() {
  const chunks = []
  let size = 0
  for await (const chunk of process.stdin) {
    size += Buffer.byteLength(chunk)
    if (size > 4096) throw new Error('Input too large')
    chunks.push(Buffer.from(chunk))
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

async function databaseOperations(environment, error) {
  if (!environment.DATABASE_URL) throw new Error('Missing database configuration')
  const [
    { Pool },
    { PostgresContentRepository },
    { PostgresSubscriptionStore },
    { OwnerSubscriberOperations },
    { createLogger, newCorrelationId },
  ] = await Promise.all([
    import('pg'),
    import('../src/server/database/postgres-content-repository.ts'),
    import('../src/server/database/postgres-subscriptions.ts'),
    import('../src/server/subscriptions/owner-operations.ts'),
    import('../src/server/observability/logger.ts'),
  ])
  const pool = new Pool({
    connectionString: environment.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 30_000,
  })
  pool.on('error', () => error('The database connection was interrupted.'))
  const store = new PostgresSubscriptionStore(new PostgresContentRepository(pool))
  return {
    operations: new OwnerSubscriberOperations(
      store,
      createLogger({
        correlationId: newCorrelationId(),
        sink: (line) => error(line),
      }),
    ),
    close: () => pool.end(),
  }
}

export async function runSubscribers({
  args = process.argv.slice(2),
  environment = process.env,
  input = stdinInput,
  output = console.log,
  error = console.error,
  connect = databaseOperations,
} = {}) {
  let connection
  try {
    if (args.length === 1 && args[0] === '--help') {
      output(usage)
      return 0
    }
    if (args.length !== 1 || !['summary', 'export', 'erase'].includes(args[0])) {
      error(usage)
      return 1
    }
    const operation = args[0]
    const fields = operation === 'summary' ? {} : await input()
    if (
      !fields ||
      typeof fields !== 'object' ||
      Array.isArray(fields) ||
      Object.keys(fields).some((key) => !['email', 'confirmation'].includes(key))
    )
      throw new Error('Invalid input')
    connection = await connect(environment, error)
    const { operations } = connection
    const result =
      operation === 'summary'
        ? await operations.summary()
        : operation === 'export'
          ? await operations.exportSubscriber(fields.email)
          : { status: await operations.eraseSubscriber(fields.email, fields.confirmation) }
    output(JSON.stringify(result ?? { status: 'not-found' }, null, 2))
    return result === null ? 1 : 0
  } catch {
    // Never print input, SQL, driver text, or connection information on failure.
    error(
      'Subscriber operation failed. Check the input and database configuration; no success is assumed.',
    )
    return 1
  } finally {
    if (connection)
      await connection.close().catch(() => error('Could not close the database connection.'))
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const hooks = registerApplicationModules()
  try {
    process.exitCode = await runSubscribers()
  } finally {
    hooks.deregister()
  }
}
