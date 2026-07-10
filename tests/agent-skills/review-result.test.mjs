import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildAegisIngestCommand,
  validateReviewResult,
} from "../../scripts/agent-skills/lib.mjs";

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

test("builds an argument-safe Aegis CLI ingestion command", (t) => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "blog-agent-skill-result-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const resultPath = path.join(root, "reports/agent-skills/task49.json");
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, `${JSON.stringify(validResult(), null, 2)}\n`);

  const invocation = buildAegisIngestCommand({ root, resultPath });
  assert.equal(invocation.command, "./.aegis/bin/aegis");
  assert.deepEqual(invocation.args.slice(0, 7), [
    "log",
    "--target-dir",
    ".",
    "--handler",
    "agent-skill:cross-agent-skill-platform",
    "--event-class",
    "verification",
  ]);
  assert.ok(invocation.args.includes("reports/agent-skills/task49.json"));
});

test("refuses to ingest evidence outside the generated reports root", (t) => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "blog-agent-skill-result-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const resultPath = path.join(root, "outside.json");
  fs.writeFileSync(resultPath, `${JSON.stringify(validResult(), null, 2)}\n`);

  assert.throws(
    () => buildAegisIngestCommand({ root, resultPath }),
    /must be beneath reports\/agent-skills/,
  );
});
