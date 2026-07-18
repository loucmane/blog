import { drizzle } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'

import * as schema from './schema'

export function createContentDatabase(pool: Pool) {
  return drizzle(pool, { schema })
}
