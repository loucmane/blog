import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validatePlatform } from "../../scripts/agent-skills/lib.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function copyFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "blog-agent-skills-"));
  for (const relativePath of [
    ".gitignore",
    ".prettierignore",
    "package.json",
    ".github/workflows/ci.yml",
    "config/agent-skills/catalog.yaml",
    "config/agent-skills/review-map.yaml",
    "config/agent-skills/upstream.lock.json",
    "schemas/agent-skills/review-result.schema.json",
    ".claude/skills/cross-agent-skill-platform/SKILL.md",
    ".claude/skills/cross-agent-skill-platform/agents/openai.yaml",
    ".claude/skills/magazine-product-discovery/SKILL.md",
    ".claude/skills/magazine-product-discovery/agents/openai.yaml",
  ]) {
    const source = path.join(repositoryRoot, relativePath);
    const destination = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
  const link = path.join(root, ".agents/skills/cross-agent-skill-platform");
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync("../../.claude/skills/cross-agent-skill-platform", link);
  fs.symlinkSync(
    "../../.claude/skills/magazine-product-discovery",
    path.join(root, ".agents/skills/magazine-product-discovery"),
  );
  return root;
}

function editJson(root, relativePath, mutate) {
  const filePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  mutate(value);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("validates the repository cross-agent platform", () => {
  const report = validatePlatform({ root: repositoryRoot });
  assert.deepEqual(report.errors, []);
  assert.equal(report.passed, true);
  assert.deepEqual(report.summary, {
    skills: 2,
    routes: 2,
    upstreamEntries: 0,
  });
});

test("rejects absolute Codex skill links", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const link = path.join(root, ".agents/skills/cross-agent-skill-platform");
  fs.unlinkSync(link);
  fs.symlinkSync(
    path.join(root, ".claude/skills/cross-agent-skill-platform"),
    link,
  );

  const report = validatePlatform({ root });
  assert.equal(report.passed, false);
  assert.ok(
    report.errors.some((error) => error.includes("symlink must be relative")),
  );
});

test("rejects unknown review-map skills", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  editJson(root, "config/agent-skills/review-map.yaml", (value) =>
    value.routes[0].skills.push("missing-skill"),
  );

  const report = validatePlatform({ root });
  assert.ok(
    report.errors.some((error) =>
      error.includes("references unknown skill missing-skill"),
    ),
  );
});

test("rejects unregistered canonical skills and Codex links", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const canonical = path.join(root, ".claude/skills/unregistered-skill");
  fs.mkdirSync(canonical, { recursive: true });
  fs.writeFileSync(
    path.join(canonical, "SKILL.md"),
    "---\nname: unregistered-skill\ndescription: This skill is intentionally absent from the catalog fixture.\n---\n",
  );
  fs.symlinkSync(
    "../../.claude/skills/unregistered-skill",
    path.join(root, ".agents/skills/unregistered-skill"),
  );

  const report = validatePlatform({ root });
  assert.ok(
    report.errors.includes(
      "unregistered canonical skill directory: unregistered-skill",
    ),
  );
  assert.ok(
    report.errors.includes("unregistered Codex skill link: unregistered-skill"),
  );
});

test("rejects enforced subjective review mode", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  editJson(root, "config/agent-skills/catalog.yaml", (value) => {
    value.policy.subjectiveFindings = "blocking";
  });

  const report = validatePlatform({ root });
  assert.ok(report.errors.includes("subjective findings must remain advisory"));
});

test("requires a digest lock for upstream skills", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  editJson(root, "config/agent-skills/catalog.yaml", (value) => {
    value.skills[0].provenance.type = "upstream";
  });

  const report = validatePlatform({ root });
  assert.ok(
    report.errors.some((error) =>
      error.includes("upstream provenance requires a lock entry"),
    ),
  );
});

test("fails closed on malformed JSON-compatible YAML", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(root, "config/agent-skills/catalog.yaml"),
    "skills:\n  - broken",
  );

  const report = validatePlatform({ root });
  assert.equal(report.passed, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("expected JSON-compatible YAML"),
    ),
  );
});
