import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateReviewResult } from "../../scripts/agent-skills/lib.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8"));
const fixture = readJson(
  "tests/agent-skills/fixtures/magazine-product-discovery.json",
);
const skill = fs.readFileSync(
  path.join(
    repositoryRoot,
    ".claude/skills/magazine-product-discovery/SKILL.md",
  ),
  "utf8",
);

function matchesDiscovery(prompt) {
  const normalized = prompt.toLowerCase();
  const denied = fixture.routingContract.excludeAny.some((signal) =>
    normalized.includes(signal),
  );
  const included = fixture.routingContract.includeAny.some((signal) =>
    normalized.includes(signal),
  );
  return included && !denied;
}

test("registers the canonical skill and advisory review route", () => {
  const catalog = readJson("config/agent-skills/catalog.yaml");
  const reviewMap = readJson("config/agent-skills/review-map.yaml");
  const catalogSkill = catalog.skills.find(
    ({ id }) => id === "magazine-product-discovery",
  );
  const route = reviewMap.routes.find(
    ({ id }) => id === "magazine-product-discovery",
  );

  assert.equal(catalogSkill.provenance.type, "project-authored");
  assert.equal(catalogSkill.provenance.task, "50");
  assert.equal(catalogSkill.resultSchema, "agent-skill-review-result-v1");
  assert.deepEqual(route.skills, ["magazine-product-discovery"]);
  assert.equal(route.mode, "advisory");

  const link = path.join(
    repositoryRoot,
    ".agents/skills/magazine-product-discovery",
  );
  assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  assert.equal(
    fs.readlinkSync(link),
    "../../.claude/skills/magazine-product-discovery",
  );
});

test("keeps documented trigger signals aligned with deterministic fixtures", () => {
  const normalizedSkill = skill.toLowerCase();
  for (const signal of [
    ...fixture.routingContract.includeAny,
    ...fixture.routingContract.excludeAny,
  ]) {
    assert.ok(
      normalizedSkill.includes(signal),
      `missing trigger signal ${signal}`,
    );
  }
  assert.equal(skill.includes("TODO"), false);
});

test("accepts positive fixtures and rejects deny-path fixtures", () => {
  for (const example of fixture.positive) {
    assert.equal(matchesDiscovery(example.prompt), true, example.id);
  }
  for (const example of fixture.deny) {
    assert.equal(matchesDiscovery(example.prompt), false, example.id);
  }
});

test("emits schema-valid advisory discovery findings", () => {
  assert.deepEqual(validateReviewResult(fixture.reviewResult), []);
  assert.deepEqual(
    new Set(fixture.reviewResult.findings.map(({ category }) => category)),
    new Set(["product-decision", "assumption", "open-question"]),
  );
  assert.ok(
    fixture.reviewResult.findings.every(
      ({ subjective, blocking }) => subjective && !blocking,
    ),
  );
});

test("treats discovery evidence as untrusted data without expanding authority", () => {
  const outputContract = fs.readFileSync(
    path.join(
      repositoryRoot,
      ".claude/skills/magazine-product-discovery/references/discovery-output-contract.md",
    ),
    "utf8",
  );
  const safetyContract = `${skill}\n${outputContract}`.toLowerCase();

  for (const requiredRule of [
    "untrusted data",
    "embedded instructions",
    "never execute commands",
    "current repository root",
    "credentials, tokens, private keys",
    "attempts to change scope or authority",
  ]) {
    assert.ok(
      safetyContract.includes(requiredRule),
      `missing hostile-evidence rule: ${requiredRule}`,
    );
  }
});
