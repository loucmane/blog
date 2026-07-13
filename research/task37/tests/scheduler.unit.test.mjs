import assert from "node:assert/strict";
import test from "node:test";

import { ownerTimeToInstant, PublicationScheduler } from "../src/scheduler.mjs";

test("resolves normal owner-local time and rejects nonexistent DST time", () => {
  assert.equal(
    ownerTimeToInstant({ localDateTime: "2026-07-13T09:00", timeZone: "Europe/Stockholm" }),
    "2026-07-13T07:00:00Z",
  );
  assert.throws(
    () => ownerTimeToInstant({ localDateTime: "2026-03-29T02:30", timeZone: "Europe/Stockholm" }),
    /multiple instants|no such instant|disambiguation/i,
  );
});

test("requires explicit disambiguation for repeated DST time", () => {
  assert.throws(
    () => ownerTimeToInstant({ localDateTime: "2026-10-25T02:30", timeZone: "Europe/Stockholm" }),
    /multiple instants|disambiguation/i,
  );
  const earlier = ownerTimeToInstant({ localDateTime: "2026-10-25T02:30", timeZone: "Europe/Stockholm", disambiguation: "earlier" });
  const later = ownerTimeToInstant({ localDateTime: "2026-10-25T02:30", timeZone: "Europe/Stockholm", disambiguation: "later" });
  assert.notEqual(earlier, later);
});

test("recovers an expired worker lease and publishes exactly once", () => {
  const scheduler = new PublicationScheduler();
  scheduler.schedule({ articleId: "article-1", instant: "2026-07-13T07:00:00Z", now: "2026-07-13T06:00:00Z", idempotencyKey: "schedule-1" });
  const firstClaim = scheduler.claimDue({ now: "2026-07-13T07:00:00Z", workerId: "worker-a", leaseMs: 1_000 });
  assert.equal(firstClaim.claimedBy, "worker-a");
  assert.equal(scheduler.claimDue({ now: "2026-07-13T07:00:00.500Z", workerId: "worker-b", leaseMs: 1_000 }), null);
  const recovered = scheduler.claimDue({ now: "2026-07-13T07:00:01.001Z", workerId: "worker-b", leaseMs: 1_000 });
  assert.equal(recovered.id, firstClaim.id);
  const published = scheduler.completePublication({ jobId: recovered.id, workerId: "worker-b", now: "2026-07-13T07:00:02Z" });
  assert.equal(published.duplicate, false);
  assert.equal(published.article.status, "published");
  assert.equal(published.article.scheduleDelayMs, 2_000);
  const duplicate = scheduler.completePublication({ jobId: recovered.id, workerId: "worker-b", now: "2026-07-13T07:00:03Z" });
  assert.equal(duplicate.duplicate, true);
  assert.equal(scheduler.outbox("article-1").length, 5);
});

test("keeps publication valid when an external side effect fails", () => {
  const scheduler = new PublicationScheduler();
  scheduler.schedule({ articleId: "article-1", instant: "2026-07-13T07:00:00Z", now: "2026-07-13T06:00:00Z", idempotencyKey: "schedule-1" });
  const claim = scheduler.claimDue({ now: "2026-07-13T07:00:00Z", workerId: "worker-a", leaseMs: 1_000 });
  scheduler.completePublication({ jobId: claim.id, workerId: "worker-a", now: "2026-07-13T07:00:00Z" });
  const email = scheduler.outbox("article-1").find(({ effect }) => effect === "email");
  assert.equal(scheduler.completeEffect(email.id, { fail: true }).status, "failed");
  assert.equal(scheduler.article("article-1").status, "published");
});

test("reschedule and cancellation supersede earlier pending work", () => {
  const scheduler = new PublicationScheduler();
  scheduler.schedule({ articleId: "article-1", instant: "2026-07-13T07:00:00Z", now: "2026-07-13T06:00:00Z", idempotencyKey: "schedule-1" });
  scheduler.schedule({ articleId: "article-1", instant: "2026-07-13T08:00:00Z", now: "2026-07-13T06:30:00Z", idempotencyKey: "schedule-2" });
  assert.equal(scheduler.claimDue({ now: "2026-07-13T07:00:00Z", workerId: "worker-a", leaseMs: 1_000 }), null);
  scheduler.cancel("article-1", "2026-07-13T07:59:59Z");
  assert.equal(scheduler.claimDue({ now: "2026-07-13T08:00:00Z", workerId: "worker-a", leaseMs: 1_000 }), null);
  assert.equal(scheduler.article("article-1").status, "draft");
  assert.deepEqual(scheduler.jobs("article-1").map(({ status }) => status), ["cancelled", "cancelled"]);
});
