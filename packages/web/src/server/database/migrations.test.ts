import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getTableColumns, getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { applyContentMigrations, readContentMigrations, type MigrationClient } from './migrations'
import { contentTableNames, contentTables } from './schema'

class FakeMigrationClient implements MigrationClient {
  readonly queries: { text: string; values: readonly unknown[] }[] = []
  readonly existing = new Map<string, string>()
  failOnMigration = false
  released = false

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ rows: readonly Row[] }> {
    this.queries.push({ text, values })
    if (text.startsWith('SELECT checksum')) {
      const checksum = this.existing.get(String(values[0]))
      return { rows: (checksum ? [{ checksum }] : []) as unknown as Row[] }
    }
    if (this.failOnMigration && text.includes('CREATE TABLE publication_settings')) {
      throw new Error('synthetic interrupted migration')
    }
    if (text.startsWith('INSERT INTO content_schema_migrations')) {
      this.existing.set(String(values[0]), String(values[1]))
    }
    return { rows: [] }
  }

  release() {
    this.released = true
  }
}

describe('content database migrations', () => {
  it('keeps reviewed SQL and the Drizzle projection aligned', async () => {
    const migrationPath = path.join(
      process.cwd(),
      'packages/web/migrations/0001_content_foundation.sql',
    )
    const sql = await readFile(migrationPath, 'utf8')
    const createdTables = [...sql.matchAll(/CREATE TABLE ([a-z_]+)/g)]
      .map((match) => match[1])
      .sort()

    expect(createdTables).toEqual([...contentTableNames].sort())
    for (const table of contentTables) {
      const tableName = getTableName(table)
      const block = sql.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\n\\);`))?.[1]
      expect(block, `${tableName} SQL block`).toBeDefined()
      for (const column of Object.values(getTableColumns(table))) {
        expect(block, `${tableName}.${column.name}`).toMatch(
          new RegExp(`^\\s+${column.name}\\s`, 'm'),
        )
      }
    }
    expect(sql).toContain('DEFERRABLE INITIALLY DEFERRED')
    expect(sql).toContain("original_sha256 ~ '^[0-9a-f]{64}$'")
    expect(sql).toContain('GENERATED ALWAYS AS')
    expect(sql).toContain('USING gin (document)')
    expect(sql).not.toContain('CREATE EXTENSION')
  })

  it('applies checksum-pinned migrations transactionally and skips exact replays', async () => {
    const migrations = await readContentMigrations()
    const first = new FakeMigrationClient()

    await expect(
      applyContentMigrations({ connect: async () => first }, migrations),
    ).resolves.toEqual({ applied: ['0001_content_foundation'], skipped: [] })
    expect(first.queries.at(0)?.text).toBe('BEGIN')
    expect(first.queries.at(-1)?.text).toBe('COMMIT')
    expect(first.released).toBe(true)

    const second = new FakeMigrationClient()
    second.existing.set(migrations[0]!.id, migrations[0]!.checksum)
    await expect(
      applyContentMigrations({ connect: async () => second }, migrations),
    ).resolves.toEqual({ applied: [], skipped: ['0001_content_foundation'] })
  })

  it('fails closed on checksum drift and rolls interrupted migrations back', async () => {
    const migrations = await readContentMigrations()
    const drift = new FakeMigrationClient()
    drift.existing.set(migrations[0]!.id, '0'.repeat(64))
    await expect(
      applyContentMigrations({ connect: async () => drift }, migrations),
    ).rejects.toThrow(/checksum does not match/)
    expect(drift.queries.at(-1)?.text).toBe('ROLLBACK')

    const interrupted = new FakeMigrationClient()
    interrupted.failOnMigration = true
    await expect(
      applyContentMigrations({ connect: async () => interrupted }, migrations),
    ).rejects.toThrow(/synthetic interrupted migration/)
    expect(interrupted.queries.at(-1)?.text).toBe('ROLLBACK')
    expect(interrupted.released).toBe(true)
  })
})
