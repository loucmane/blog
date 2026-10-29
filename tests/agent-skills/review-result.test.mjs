import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildBeadsIngestPlan,
  validateReviewResult,
} from "../../scripts/agent-skills/lib.mjs";

const repository = fileURLToPath(new URL('../../', import.meta.url));

function validResult() {
  return {
    schemaVersion: 1,
    reviewId: "task49-platform-review",
    skill: "cross-agent-skill-platform",
    mode: "advisory",
    verdict: "pass",
    summary: "Deterministic platform checks passed.",
    generatedAt: "2026-07-10T12:00:00Z",
    headSha: "0123456789abcdef0123456789abcdef01234567",
    findings: [],
    evidence: [{ kind: "command", path: "pnpm ci:agent-skills" }],
  };
}

test("accepts a schema-valid advisory review result", () => {
  assert.deepEqual(validateReviewResult(validResult()), []);
});

test("rejects subjective blocking findings", () => {
  const result = validResult();
  result.findings.push({
    id: "visual-opinion",
    severity: "warning",
    category: "design",
    message: "Typography could feel more editorial.",
    subjective: true,
    blocking: true,
    evidence: ["reviewer observation"],
  });

  assert.ok(
    validateReviewResult(result).some((error) =>
      error.includes("subjective finding blocking"),
    ),
  );
});

test("rejects enforcement mode during advisory dogfood", () => {
  const result = validResult();
  result.mode = "enforced";
  assert.ok(validateReviewResult(result).includes("mode must remain advisory"));
});

test("builds an argument-safe Beads ingestion plan", (t) => {
  const root = fs.mkdtempSync(
    path.join(repository, "tests/agent-skills/.review-result-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const resultPath = path.join(root, "reports/agent-skills/task49.json");
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, `${JSON.stringify(validResult(), null, 2)}\n`);

  const plan = buildBeadsIngestPlan({ root, resultPath, bead: "blog-example" });
  assert.deepEqual(plan.gcArgv.slice(0, 8), [
    "/home/loucmane/gascity/bin/gc",
    "--city",
    "/home/loucmane/gascity/city",
    "--rig",
    "blog",
    "bd",
    "update",
    "blog-example",
  ]);
  assert.equal(plan.receipt.evidence, "reports/agent-skills/task49.json");
  assert.equal(plan.worklog.path, "docs/worklog/blog-example.md");
});

test("refuses to ingest evidence outside the generated reports root", (t) => {
  const root = fs.mkdtempSync(
    path.join(repository, "tests/agent-skills/.review-result-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const resultPath = path.join(root, "outside.json");
  fs.writeFileSync(resultPath, `${JSON.stringify(validResult(), null, 2)}\n`);

  assert.throws(
    () => buildBeadsIngestPlan({ root, resultPath, bead: "blog-example" }),
    /must be beneath reports\/agent-skills/,
  );
});
