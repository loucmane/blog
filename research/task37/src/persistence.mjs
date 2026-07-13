import { scryptSync, timingSafeEqual } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const articles = pgTable("articles", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  status: text("status").notNull(),
  documentSchemaVersion: integer("document_schema_version").notNull(),
  document: jsonb("document").notNull(),
  searchText: text("search_text").notNull().default(""),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const migrations = [
  {
    version: 1,
    statements: [
      `CREATE TABLE articles (
        id text PRIMARY KEY,
        slug text NOT NULL UNIQUE,
        title text NOT NULL,
        status text NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'unpublished')),
        document_schema_version integer NOT NULL,
        document jsonb NOT NULL,
        scheduled_at timestamptz,
        published_at timestamptz,
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      )`,
      `CREATE TABLE article_revisions (
        id text PRIMARY KEY,
        article_id text NOT NULL REFERENCES articles(id),
        article_version integer NOT NULL,
        document_schema_version integer NOT NULL,
        document jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        UNIQUE (article_id, article_version)
      )`,
      `CREATE TABLE media_assets (
        id text PRIMARY KEY,
        object_key text NOT NULL UNIQUE,
        original_sha256 text NOT NULL,
        rendition_sha256 text,
        metadata jsonb NOT NULL,
        created_at timestamptz NOT NULL
      )`,
      `CREATE TABLE owner_credentials (
        id text PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password_salt text NOT NULL,
        password_hash text NOT NULL,
        created_at timestamptz NOT NULL
      )`,
    ],
  },
  {
    version: 2,
    statements: [
      "ALTER TABLE articles ADD COLUMN search_text text NOT NULL DEFAULT ''",
      "CREATE INDEX articles_search_text_idx ON articles USING gin (to_tsvector('english', search_text))",
      "CREATE INDEX articles_publication_idx ON articles (status, scheduled_at)",
    ],
  },
];

export async function applyMigrations(pool, { targetVersion = migrations.at(-1).version } = {}) {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version integer PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const applied = new Set((await pool.query("SELECT version FROM schema_migrations")).rows.map(({ version }) => version));
  for (const migration of migrations) {
    if (migration.version > targetVersion || applied.has(migration.version)) continue;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const statement of migration.statements) await client.query(statement);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [migration.version]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  return (await pool.query("SELECT version FROM schema_migrations ORDER BY version")).rows.map(({ version }) => version);
}

export function database(pool) {
  return drizzle(pool);
}

export function syntheticCredential(password, salt = "task37-synthetic-salt") {
  return {
    salt,
    hash: scryptSync(password, salt, 32).toString("hex"),
  };
}

export function verifySyntheticCredential(password, { salt, hash }) {
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
