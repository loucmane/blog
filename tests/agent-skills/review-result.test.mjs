import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildBeadsIngestPlan,
  validateReviewResult,
} from "../../scripts/agent-skills/lib.mjs";
import { blockingEligibleCategories } from "../../scripts/agent-skills/routing.mjs";

const repository = fileURLToPath(new URL('../../', import.meta.url));
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(repository, file), "utf8"));
const schema = readJson("schemas/agent-skills/review-result.schema.json");
// ESLint already installs Ajv; no new dependency or network resolution. Ajv 6
// understands every assertion used here (also present in draft 7). Disable only
// meta-schema lookup for the 2020-12 URI, not validation or format assertions.
// Unknown keywords must throw rather than silently weakening this oracle.
const require = createRequire(import.meta.url);
const Ajv = createRequire(require.resolve("eslint"))("ajv");
const schemaValidator = new Ajv({
  allErrors: true,
  format: "full",
  validateSchema: false,
  strictKeywords: true,
}).compile(schema);

function assertDecisions(result, expected, context) {
  const runtimeErrors = validateReviewResult(result);
  const schemaValid = schemaValidator(result);
  assert.deepEqual(
    { runtime: runtimeErrors.length === 0, schema: schemaValid },
    { runtime: expected, schema: expected },
    `${context}\nruntime: ${JSON.stringify(runtimeErrors)}\nschema: ${JSON.stringify(schemaValidator.errors)}`,
  );
}

const corpusDirectory = "tests/agent-skills/review-result-corpus";
const corpusFiles = fs.readdirSync(path.join(repository, corpusDirectory)).filter((name) => name.endsWith(".json")).sort();
assert.ok(corpusFiles.length > 0, "the parity corpus must not be empty");
for (const name of corpusFiles) {
  const entry = readJson(`${corpusDirectory}/${name}`);
  test(`shared review corpus: ${name}`, () => {
    assert.equal(typeof entry.valid, "boolean");
    assert.ok(typeof entry.reason === "string" && entry.reason.trim());
    assert.ok(Object.hasOwn(entry, "result"));
    assertDecisions(entry.result, entry.valid, `${name}: ${entry.reason}`);
  });
}

test("schema blocking categories stay aligned with the ingestion allowlist", () => {
  assert.deepEqual(
    schema.properties.findings.items.allOf[1].then.properties.category.enum,
    blockingEligibleCategories,
  );
});

function jsonFiles(directory) {
  return fs.readdirSync(path.join(repository, directory), { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory()
      ? jsonFiles(`${directory}/${entry.name}`)
      : entry.name.endsWith(".json") ? [`${directory}/${entry.name}`] : [])
    .sort();
}

function envelopes(value, source) {
  if (value === null || typeof value !== "object") return [];
  if (Object.hasOwn(value, "reviewId") && Object.hasOwn(value, "skill")) {
    return [{ source, result: value }];
  }
  return Object.entries(value).flatMap(([key, child]) => envelopes(child, `${source}#${key}`));
}

for (const file of [
  ...jsonFiles("tests/agent-skills/fixtures"),
  ...jsonFiles("tests/agent-skills/examples"),
  "docs/agent-skills/forward-blind-review.json",
  "docs/agent-skills/advice-v2-review.json",
]) {
  const document = readJson(file);
  for (const { source, result } of envelopes(document, file)) {
    test(`existing review envelope: ${source}`, () => assertDecisions(result, true, source));
  }
  for (const [index, example] of (document.deterministicExamples ?? []).entries()) {
    const source = `${file}#deterministicExamples/${index}`;
    test(`existing deterministic example: ${source}`, () => {
      assertDecisions({ ...document.reviewResult, findings: [example.finding] }, true, source);
    });
  }
}

// The forward blind bundle predates complete result envelopes. Validate each
// advice item's actual findings and evidence in a synthetic test-only wrapper
// with synthetic IDs/severities for legacy findings that lack these fields;
// this does not rewrite the historical artifact or claim it is an envelope.
for (const item of readJson("docs/agent-skills/forward-blind-review.json").cases) {
  for (const advice of item.advice) {
    const source = `forward-blind-review.json#${item.number}/${advice.skill}`;
    test(`existing forward advice projection: ${source}`, () => {
      assertDecisions({
        ...validResult(),
        skill: advice.skill,
        headSha: item.merge,
        summary: advice.recommendation,
        findings: advice.findings.map((finding, index) => ({
          id: `legacy-finding-${index}`,
          severity: "info",
          ...finding,
        })),
        evidence: advice.evidence.map((reference) => ({ kind: "file", path: reference })),
      }, true, source);
    });
  }
}

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
