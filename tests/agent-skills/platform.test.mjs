import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
    ".claude/skills/content-platform-backend/SKILL.md",
    ".claude/skills/content-platform-backend/agents/openai.yaml",
    ".claude/skills/content-platform-backend/references/content-platform-backend-output-contract.md",
    ".claude/skills/security-identity-privacy/SKILL.md",
    ".claude/skills/security-identity-privacy/agents/openai.yaml",
    ".claude/skills/security-identity-privacy/references/security-identity-privacy-output-contract.md",
    ".claude/skills/reader-frontend/SKILL.md",
    ".claude/skills/reader-frontend/agents/openai.yaml",
    ".claude/skills/reader-frontend/references/output-contract.md",
    ".claude/skills/editorial-blocks/SKILL.md",
    ".claude/skills/editorial-blocks/agents/openai.yaml",
    ".claude/skills/editorial-blocks/references/output-contract.md",
    ".claude/skills/seo-distribution/SKILL.md",
    ".claude/skills/seo-distribution/agents/openai.yaml",
    ".claude/skills/seo-distribution/references/output-contract.md",
    ".claude/skills/release-witness/SKILL.md",
    ".claude/skills/release-witness/agents/openai.yaml",
    ".claude/skills/release-witness/references/output-contract.md",
    ".claude/skills/quality-reliability-observability/SKILL.md",
    ".claude/skills/quality-reliability-observability/agents/openai.yaml",
    ".claude/skills/quality-reliability-observability/references/quality-reliability-observability-output-contract.md",
    ".claude/skills/cross-agent-skill-platform/SKILL.md",
    ".claude/skills/cross-agent-skill-platform/agents/openai.yaml",
    ".claude/skills/gas-city-coordinator/SKILL.md",
    ".claude/skills/gas-city-coordinator/agents/openai.yaml",
    ".claude/skills/magazine-product-discovery/SKILL.md",
    ".claude/skills/magazine-product-discovery/agents/openai.yaml",
    ".claude/skills/owner-publishing-ux/SKILL.md",
    ".claude/skills/owner-publishing-ux/agents/openai.yaml",
    ".claude/skills/owner-publishing-ux/references/owner-publishing-ux-output-contract.md",
    ".claude/skills/stack-research-adr/SKILL.md",
    ".claude/skills/stack-research-adr/agents/openai.yaml",
    ".claude/skills/stack-research-adr/references/stack-research-adr-output-contract.md",
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
  fs.symlinkSync(
    "../../.claude/skills/stack-research-adr",
    path.join(root, ".agents/skills/stack-research-adr"),
  );
  fs.symlinkSync(
    "../../.claude/skills/owner-publishing-ux",
    path.join(root, ".agents/skills/owner-publishing-ux"),
  );
  fs.symlinkSync(
    "../../.claude/skills/gas-city-coordinator",
    path.join(root, ".agents/skills/gas-city-coordinator"),
  );
  fs.symlinkSync(
    "../../.claude/skills/content-platform-backend",
    path.join(root, ".agents/skills/content-platform-backend"),
  );
  fs.symlinkSync(
    "../../.claude/skills/security-identity-privacy",
    path.join(root, ".agents/skills/security-identity-privacy"),
  );
  fs.symlinkSync(
    "../../.claude/skills/reader-frontend",
    path.join(root, ".agents/skills/reader-frontend"),
  );
  fs.symlinkSync(
    "../../.claude/skills/editorial-blocks",
    path.join(root, ".agents/skills/editorial-blocks"),
  );
  fs.symlinkSync(
    "../../.claude/skills/seo-distribution",
    path.join(root, ".agents/skills/seo-distribution"),
  );
  fs.symlinkSync(
    "../../.claude/skills/release-witness",
    path.join(root, ".agents/skills/release-witness"),
  );
  fs.symlinkSync(
    "../../.claude/skills/quality-reliability-observability",
    path.join(root, ".agents/skills/quality-reliability-observability"),
  );
  return root;
}

function editJson(root, relativePath, mutate) {
  const filePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  mutate(value);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function addUnregisteredSkill(root) {
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
}

// Without the caller's GIT_* variables (a hook can export GIT_DIR), fixture
// commands can only ever touch the fixture repository.
const fixtureGitEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")),
);

function git(root, ...args) {
  execFileSync("git", args, {
    cwd: root,
    env: fixtureGitEnvironment,
    stdio: "pipe",
  });
}

function initRepository(root) {
  git(root, "init", "--quiet");
  // The fixture's .gitignore alone decides, never a global excludes file.
  git(root, "config", "core.excludesFile", "/dev/null");
  git(root, "add", "--all");
}

const gasCityRuntimeSkills = ["core.gc-agents", "gascity.mayor"];

// What gc installs in every checkout: absolute symlinks into its own skill
// cache plus an ownership file, in both skill roots.
function installGasCityRuntimeSkills(root) {
  for (const skillRoot of [".claude/skills", ".agents/skills"]) {
    for (const name of gasCityRuntimeSkills) {
      const target = path.join(root, ".gc/cache/skills", name);
      fs.mkdirSync(target, { recursive: true });
      fs.symlinkSync(target, path.join(root, skillRoot, name));
    }
    fs.writeFileSync(
      path.join(root, skillRoot, ".gc-skill-ownership.json"),
      '{"targets":{}}\n',
    );
  }
}

const gasCityRuntimeErrors = [
  ...gasCityRuntimeSkills,
  ".gc-skill-ownership.json",
].flatMap((name) => [
  `unregistered canonical skill directory: ${name}`,
  `unregistered Codex skill link: ${name}`,
]);

function assertFailedClosed(report, reason) {
  const unavailable = report.errors.filter((error) =>
    error.startsWith("skill roots cannot be checked against git ignore rules"),
  );
  assert.equal(unavailable.length, 1);
  assert.match(unavailable[0], reason);
  assert.deepEqual(
    report.errors.filter((error) => error !== unavailable[0]).sort(),
    [...gasCityRuntimeErrors].sort(),
  );
  assert.equal(report.passed, false);
}

test("validates the repository cross-agent platform", () => {
  const report = validatePlatform({ root: repositoryRoot });
  assert.deepEqual(report.errors, []);
  assert.equal(report.passed, true);
  assert.deepEqual(report.summary, {
    skills: 12,
    routes: 12,
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
  addUnregisteredSkill(root);

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

test("skips Gas City runtime skills that git ignores", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  initRepository(root);
  installGasCityRuntimeSkills(root);

  const report = validatePlatform({ root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.passed, true);
});

test("still rejects unregistered skills that git does not ignore", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  initRepository(root);
  installGasCityRuntimeSkills(root);
  addUnregisteredSkill(root);

  const report = validatePlatform({ root });
  assert.deepEqual([...report.errors].sort(), [
    "unregistered Codex skill link: unregistered-skill",
    "unregistered canonical skill directory: unregistered-skill",
  ]);
});

test("still rejects tracked skills that match an ignore pattern", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  initRepository(root);
  installGasCityRuntimeSkills(root);
  const tracked = path.join(root, ".claude/skills/gascity.custom");
  fs.mkdirSync(tracked);
  fs.writeFileSync(
    path.join(tracked, "SKILL.md"),
    "---\nname: gascity.custom\ndescription: This skill is force-added past the Gas City ignore pattern.\n---\n",
  );
  git(root, "add", "--force", ".claude/skills/gascity.custom");

  const report = validatePlatform({ root });
  assert.deepEqual(report.errors, [
    "unregistered canonical skill directory: gascity.custom",
  ]);
});

test("fails closed when the root is not a git work tree", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  installGasCityRuntimeSkills(root);

  assertFailedClosed(validatePlatform({ root }), /\(.+\)$/);
});

test("fails closed when git is unavailable", (t) => {
  const root = copyFixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  initRepository(root);
  installGasCityRuntimeSkills(root);

  const searchPath = process.env.PATH;
  process.env.PATH = path.join(root, "no-git-here");
  let report;
  try {
    report = validatePlatform({ root });
  } finally {
    process.env.PATH = searchPath;
  }
  assertFailedClosed(report, /\(spawnSync git ENOENT\)$/);
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
