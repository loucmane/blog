import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import { fromDrizzle, PgBoss } from "pg-boss";
import sharp from "sharp";

import {
  applyMigrations,
  articles,
  database,
  syntheticCredential,
  verifySyntheticCredential,
} from "../src/persistence.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const connectionString = process.env.TASK37_DATABASE_URL;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function bodyToBuffer(body) {
  return Buffer.from(await body.transformToByteArray());
}

function s3(endpoint) {
  return new S3Client({
    endpoint,
    forcePathStyle: true,
    region: "us-east-1",
    credentials: { accessKeyId: "task37-access", secretAccessKey: "task37-local-secret" },
  });
}

function dockerCompose(args, options = {}) {
  const result = spawnSync("docker", ["compose", ...args], {
    cwd: root,
    encoding: options.encoding ?? "buffer",
    input: options.input,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(Buffer.from(result.stderr ?? "").toString());
  return result.stdout;
}

test("proves PostgreSQL migrations, pg-boss, media portability, and isolated restore", async () => {
  assert.ok(connectionString, "TASK37_DATABASE_URL is required");
  const pool = new Pool({ connectionString, max: 4 });
  const db = database(pool);
  const now = new Date("2026-07-13T12:50:51Z");
  const fixture = JSON.parse(fs.readFileSync(path.join(root, "fixtures/article.v1.json"), "utf8"));

  assert.deepEqual(await applyMigrations(pool, { targetVersion: 1 }), [1]);
  await pool.query(
    `INSERT INTO articles
      (id, slug, title, status, document_schema_version, document, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [fixture.articleId, "portable-editorial-story", fixture.title, "draft", fixture.schemaVersion, fixture.document, now, now],
  );
  assert.deepEqual(await applyMigrations(pool), [1, 2]);
  assert.deepEqual(await applyMigrations(pool), [1, 2]);
  const populated = await db.select().from(articles).where(eq(articles.id, fixture.articleId));
  assert.equal(populated.length, 1);
  assert.equal(populated[0].searchText, "");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("ALTER TABLE articles ADD COLUMN interrupted_marker text");
    throw new Error("synthetic migration interruption");
  } catch {
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
  const interruptedColumn = await pool.query("SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='interrupted_marker'");
  assert.equal(interruptedColumn.rowCount, 0);

  const credential = syntheticCredential("task37-owner-password");
  await pool.query(
    "INSERT INTO owner_credentials (id, email, password_salt, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)",
    ["owner-task37", "owner@task37.example.invalid", credential.salt, credential.hash, now],
  );
  await pool.query(
    "INSERT INTO article_revisions (id, article_id, article_version, document_schema_version, document, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    ["revision-task37-1", fixture.articleId, 1, fixture.schemaVersion, fixture.document, now],
  );

  const bossErrors = [];
  const boss = new PgBoss({ connectionString, schema: "pgboss_task37", supervise: false, schedule: false });
  boss.on("error", (error) => bossErrors.push(error));
  await boss.start();
  assert.equal(await boss.schemaVersion(), 37);
  await boss.createQueue("publish-article", { policy: "stately", retryLimit: 2, retryBackoff: true });
  await assert.rejects(
    db.transaction(async (transaction) => {
      await boss.send("publish-article", { articleId: "rolled-back" }, {
        singletonKey: "rolled-back:1",
        db: fromDrizzle(transaction, sql),
      });
      throw new Error("synthetic application transaction rollback");
    }),
    /synthetic application transaction rollback/,
  );
  assert.deepEqual(await boss.findJobs("publish-article", { key: "rolled-back:1" }), []);
  const jobId = await boss.send("publish-article", { articleId: fixture.articleId }, { singletonKey: `${fixture.articleId}:1` });
  const duplicate = await boss.send("publish-article", { articleId: fixture.articleId }, { singletonKey: `${fixture.articleId}:1` });
  assert.ok(jobId);
  assert.equal(duplicate, null);
  const bossTwo = new PgBoss({
    connectionString,
    schema: "pgboss_task37",
    supervise: false,
    schedule: false,
    createSchema: false,
    migrate: false,
  });
  bossTwo.on("error", (error) => bossErrors.push(error));
  await bossTwo.start();
  const competingClaims = await Promise.all([
    boss.fetch("publish-article", { batchSize: 1 }),
    bossTwo.fetch("publish-article", { batchSize: 1 }),
  ]);
  const jobs = competingClaims.flat();
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].data.articleId, fixture.articleId);
  await boss.complete("publish-article", jobs[0].id);
  assert.equal((await boss.detectSchemaDrift()).ok, true);
  await bossTwo.stop({ graceful: true, timeout: 5_000 });
  await boss.stop({ graceful: true, timeout: 5_000 });
  assert.deepEqual(bossErrors, []);

  const primary = s3(process.env.TASK37_S3_PRIMARY);
  const restore = s3(process.env.TASK37_S3_RESTORE);
  const bucket = "task37-media";
  await primary.send(new CreateBucketCommand({ Bucket: bucket }));
  await restore.send(new CreateBucketCommand({ Bucket: bucket }));
  const original = await sharp({
    create: { width: 64, height: 40, channels: 4, background: { r: 32, g: 80, b: 160, alpha: 1 } },
  }).png().toBuffer();
  const rendition = await sharp(original).resize({ width: 32 }).webp({ quality: 80 }).toBuffer();
  const objects = [
    { key: "originals/task37.png", value: original },
    { key: "renditions/task37-32.webp", value: rendition },
  ];
  const mediaManifest = [];
  for (const object of objects) {
    const checksum = sha256(object.value);
    await primary.send(new PutObjectCommand({
      Bucket: bucket,
      Key: object.key,
      Body: object.value,
      Metadata: { "application-sha256": checksum },
    }));
    const head = await primary.send(new HeadObjectCommand({ Bucket: bucket, Key: object.key }));
    assert.equal(head.Metadata["application-sha256"], checksum);
    const downloaded = await bodyToBuffer((await primary.send(new GetObjectCommand({ Bucket: bucket, Key: object.key }))).Body);
    assert.equal(sha256(downloaded), checksum);
    await restore.send(new PutObjectCommand({ Bucket: bucket, Key: object.key, Body: downloaded, Metadata: head.Metadata }));
    const restored = await bodyToBuffer((await restore.send(new GetObjectCommand({ Bucket: bucket, Key: object.key }))).Body);
    assert.equal(sha256(restored), checksum);
    mediaManifest.push({ key: object.key, bytes: object.value.length, sha256: checksum });
  }
  assert.equal((await sharp(rendition).metadata()).width, 32);
  await pool.query(
    "INSERT INTO media_assets (id, object_key, original_sha256, rendition_sha256, metadata, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    ["media-task37", objects[0].key, mediaManifest[0].sha256, mediaManifest[1].sha256, { manifest: mediaManifest }, now],
  );

  const dumpStarted = Date.now();
  const dump = dockerCompose(["exec", "-T", "postgres", "pg_dump", "-U", "task37", "-d", "magazine", "--format=custom"]);
  assert.ok(dump.length > 0);
  dockerCompose(["exec", "-T", "postgres", "dropdb", "-U", "task37", "--if-exists", "--force", "magazine_restore"]);
  dockerCompose(["exec", "-T", "postgres", "createdb", "-U", "task37", "magazine_restore"]);
  dockerCompose(["exec", "-T", "postgres", "pg_restore", "-U", "task37", "-d", "magazine_restore", "--exit-on-error"], { input: dump });
  const restoreDurationMs = Date.now() - dumpStarted;

  const restoredPool = new Pool({ connectionString: connectionString.replace(/\/magazine$/, "/magazine_restore"), max: 2 });
  const counts = await restoredPool.query(`SELECT
    (SELECT count(*)::int FROM articles) AS articles,
    (SELECT count(*)::int FROM article_revisions) AS revisions,
    (SELECT count(*)::int FROM media_assets) AS media,
    (SELECT count(*)::int FROM owner_credentials) AS owners`);
  assert.deepEqual(counts.rows[0], { articles: 1, revisions: 1, media: 1, owners: 1 });
  const restoredOwner = (await restoredPool.query("SELECT password_salt AS salt, password_hash AS hash FROM owner_credentials WHERE id='owner-task37'")).rows[0];
  assert.equal(verifySyntheticCredential("task37-owner-password", restoredOwner), true);
  const restoredArticle = (await restoredPool.query("SELECT document FROM articles WHERE id=$1", [fixture.articleId])).rows[0];
  assert.deepEqual(restoredArticle.document, fixture.document);
  assert.ok(restoreDurationMs < 60_000);
  await restoredPool.end();
  await pool.end();
  primary.destroy();
  restore.destroy();

  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "task37-restore-"));
  fs.writeFileSync(path.join(reportDir, "media-manifest.json"), `${JSON.stringify(mediaManifest, null, 2)}\n`);
  assert.ok(fs.statSync(path.join(reportDir, "media-manifest.json")).size > 0);
});
