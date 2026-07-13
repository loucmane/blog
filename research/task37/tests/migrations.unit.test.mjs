import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { roundTripPortableDocument } from "../src/document.mjs";
import { inspectMigration, migrateBatchAtomically, migratePortableDocument } from "../src/migrations.mjs";

const source = JSON.parse(fs.readFileSync(new URL("../fixtures/article.v1.json", import.meta.url), "utf8"));

test("reports a deterministic one-version-at-a-time dry run", () => {
  const report = inspectMigration(source);
  assert.equal(report.canMigrate, true);
  assert.deepEqual(report.versions, ["1->2", "2->3"]);
  assert.deepEqual(report.unknown, []);
});

test("migrates callout and media metadata while retaining provenance", () => {
  const result = migratePortableDocument(source);
  assert.equal(result.status, "migrated");
  const callout = result.document.document.content.find(({ type }) => type === "callout");
  const image = result.document.document.content.find(({ type }) => type === "mediaImage");
  const gallery = result.document.document.content.find(({ type }) => type === "gallery");
  assert.deepEqual(callout.attrs, { label: "Editor note", variant: "note" });
  assert.equal(image.attrs.mediaId, "media-synthetic-hero");
  assert.deepEqual(image.attrs.focalPoint, { x: 0.42, y: 0.37 });
  assert.deepEqual(image.attrs.credit, { name: "Task 37 fixture", url: null });
  assert.equal(gallery.attrs.layout, "grid");
  assert.equal(result.document.migrationProvenance.length, 2);
  assert.equal(roundTripPortableDocument(result.document).status, "ok");
});

test("is idempotent after reaching the target version", () => {
  const first = migratePortableDocument(source).document;
  const second = migratePortableDocument(first).document;
  assert.deepEqual(second, first);
});

test("rolls an interrupted batch back to byte-equivalent originals", () => {
  const documents = [source, { ...structuredClone(source), articleId: "article-task37-second" }];
  const result = migrateBatchAtomically(documents, { failAfter: 1 });
  assert.equal(result.status, "rolled-back");
  assert.deepEqual(result.documents, documents);

  const retry = migrateBatchAtomically(result.documents);
  assert.equal(retry.status, "committed");
  assert.deepEqual(retry.documents.map(({ schemaVersion }) => schemaVersion), [3, 3]);
});

test("quarantines unknown future nodes with the original intact", () => {
  const future = structuredClone(source);
  future.document.content.push({ type: "futureNode", attrs: { version: 99 } });
  const result = migratePortableDocument(future);
  assert.equal(result.status, "quarantined");
  assert.deepEqual(result.original, future);
  assert.deepEqual(result.inspection.unknown.map(({ type }) => type), ["futureNode"]);
});
