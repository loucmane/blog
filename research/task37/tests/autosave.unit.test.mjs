import assert from "node:assert/strict";
import test from "node:test";

import {
  autosaveState,
  DraftConflictError,
  InMemoryDraftStore,
  RecoveryBuffer,
  SessionExpiredError,
} from "../src/autosave.mjs";

test("shows only server-acknowledged content as saved", () => {
  assert.deepEqual(autosaveState({ localVersion: 2, acknowledgedVersion: 1, online: true, saving: true }), {
    label: "Saving…",
    safe: false,
    action: "wait",
  });
  assert.deepEqual(autosaveState({ localVersion: 2, acknowledgedVersion: 2, online: true, saving: false }), {
    label: "All changes saved",
    safe: true,
    action: null,
  });
});

test("preserves offline and expired-session edits in a bounded recovery buffer", () => {
  const recovery = new RecoveryBuffer({ maxBytes: 256, maxAgeMs: 1_000 });
  recovery.write("draft-1", { text: "offline work" }, 100);
  assert.deepEqual(recovery.read("draft-1", 500), { text: "offline work" });
  assert.equal(recovery.read("draft-1", 1_101), null);

  const expired = new SessionExpiredError();
  assert.deepEqual(autosaveState({ online: true, error: expired }), {
    label: expired.message,
    safe: true,
    action: "sign-in",
  });
  assert.throws(() => recovery.write("too-large", { text: "x".repeat(300) }, 0), /too large/);
});

test("detects two-tab conflicts and preserves local and remote versions", () => {
  const store = new InMemoryDraftStore();
  const initial = store.create("draft-1", { text: "initial" });
  const firstTab = store.save({
    id: initial.id,
    expectedVersion: initial.version,
    content: { text: "first tab" },
    idempotencyKey: "save-first",
    acknowledgedAt: 100,
  });
  assert.throws(
    () => store.save({
      id: initial.id,
      expectedVersion: initial.version,
      content: { text: "second tab" },
      idempotencyKey: "save-second",
      acknowledgedAt: 110,
    }),
    (error) => {
      assert.ok(error instanceof DraftConflictError);
      assert.deepEqual(error.local.content, { text: "second tab" });
      assert.deepEqual(error.remote.content, { text: "first tab" });
      return true;
    },
  );
  assert.deepEqual(store.read(initial.id), firstTab);
});

test("retries saves and publication idempotently without duplicate revisions", () => {
  const store = new InMemoryDraftStore();
  const initial = store.create("draft-1", { text: "initial" });
  const save = store.save({
    id: initial.id,
    expectedVersion: initial.version,
    content: { text: "ready" },
    idempotencyKey: "save-ready",
    acknowledgedAt: 100,
  });
  const saveRetry = store.save({
    id: initial.id,
    expectedVersion: initial.version,
    content: { text: "ready" },
    idempotencyKey: "save-ready",
    acknowledgedAt: 100,
  });
  assert.deepEqual(saveRetry, save);

  const publish = store.publish({ id: initial.id, expectedVersion: save.version, idempotencyKey: "publish-1", publishedAt: 200 });
  const retry = store.publish({ id: initial.id, expectedVersion: save.version, idempotencyKey: "publish-1", publishedAt: 200 });
  assert.deepEqual(retry, publish);
  assert.equal(store.revisions(initial.id).length, 1);
});

test("blocks publish when a newer acknowledged draft exists", () => {
  const store = new InMemoryDraftStore();
  const initial = store.create("draft-1", { text: "initial" });
  store.save({
    id: initial.id,
    expectedVersion: initial.version,
    content: { text: "newer" },
    idempotencyKey: "save-newer",
    acknowledgedAt: 100,
  });
  assert.throws(
    () => store.publish({ id: initial.id, expectedVersion: initial.version, idempotencyKey: "publish-stale", publishedAt: 200 }),
    DraftConflictError,
  );
});
