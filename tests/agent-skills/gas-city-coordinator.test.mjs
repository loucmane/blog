import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const read = (relativePath) =>
  fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");

const normalizedAuthority = () =>
  `${read("AGENTS.md")}\n${read("CLAUDE.md")}`
    .toLowerCase()
    .replace(/\s+/g, " ");

test("Claude and Codex resolve one canonical Gas City coordinator skill", () => {
  const canonical = path.join(
    repositoryRoot,
    ".claude/skills/gas-city-coordinator/SKILL.md",
  );
  const codexLink = path.join(
    repositoryRoot,
    ".agents/skills/gas-city-coordinator",
  );

  assert.equal(fs.statSync(canonical).isFile(), true);
  assert.equal(fs.lstatSync(codexLink).isSymbolicLink(), true);
  assert.equal(
    fs.readlinkSync(codexLink),
    "../../.claude/skills/gas-city-coordinator",
  );
  assert.equal(fs.realpathSync(codexLink), path.dirname(canonical));
});

test("active project authority selects Beads and freezes legacy systems", () => {
  const authority = normalizedAuthority();

  assert.match(authority, /beads is the sole active task authority/);
  assert.match(authority, /\.taskmaster\/.*frozen historical/);
  assert.match(authority, /legacy aegis workflow.*frozen historical/);
  assert.match(authority, /must not be updated or repaired/);
  assert.match(authority, /project-local agent owns project intent/);
  assert.match(authority, /gas city is the delegated execution layer/);
  assert.doesNotMatch(
    authority,
    /active task authority[^.]*taskmaster|taskmaster is the active/,
  );

  assert.equal(fs.existsSync(path.join(repositoryRoot, ".taskmaster")), true);
  assert.equal(fs.existsSync(path.join(repositoryRoot, ".aegis")), true);
});

test("documents native skills and explicit isolated blog routing", () => {
  const contract = `${normalizedAuthority()} ${read(
    ".claude/skills/gas-city-coordinator/SKILL.md",
  )} ${read(".beads/README.md")}`
    .toLowerCase()
    .replace(/\s+/g, " ");

  for (const skill of [
    "gc-city",
    "gc-rigs",
    "gc-agents",
    "gc-work",
    "gc-dispatch",
  ]) {
    assert.ok(contract.includes(skill), `missing native skill ${skill}`);
  }
  assert.match(contract, /registered rig is `?blog`?/);
  assert.ok(contract.includes("/home/loucmane/gascity/bin/gc"));
  assert.ok(contract.includes("gc_home=/home/loucmane/gascity/home"));
  assert.match(contract, /--rig blog/);
  assert.match(contract, /never trust inherited `?beads_\*`?/);
  assert.match(contract, /never use a cross-rig bare `?bd`? command/);
  assert.match(contract, /every work bead receives a worklog/);
  assert.doesNotMatch(read(".beads/README.md"), /^bd\s/m);
});

test("requires the complete evidence-bounded coordinator lifecycle", () => {
  const skill = read(".claude/skills/gas-city-coordinator/SKILL.md")
    .toLowerCase()
    .replace(/\s+/g, " ");

  for (const requirement of [
    "reconcile repository, beads, worktrees, and pull request state read-only",
    "select or create a rig-scoped bead",
    "propose the dispatch before its first execution",
    "resume the blog rig",
    "verify real worker processes",
    "managed role or formula",
    "monitor the bead, session, branch, tests, and worklog",
    "route implementation through review",
    "close only with acceptance evidence",
  ]) {
    assert.ok(skill.includes(requirement), `missing lifecycle rule: ${requirement}`);
  }
});

test("does not broaden attended operator boundaries", () => {
  const contract = `${normalizedAuthority()} ${read(
    ".claude/skills/gas-city-coordinator/SKILL.md",
  )
    .toLowerCase()
    .replace(/\s+/g, " ")}`;

  for (const boundary of [
    "merge",
    "publishing",
    "destructive cleanup",
    "credential actions",
    "authority changes",
  ]) {
    assert.match(
      contract,
      new RegExp(`${boundary}[^.]*operator confirmation`),
      `missing attended boundary for ${boundary}`,
    );
  }
  assert.doesNotMatch(contract, /autonomous(?:ly)? (?:merge|publish)/);
});

test("CI enforces native coordination without reviving legacy witness authority", () => {
  const workflow = read(".github/workflows/ci.yml");

  assert.match(workflow, /- name: Native Beads and Gas City authority/);
  assert.match(workflow, /id: native_coordination/);
  assert.match(
    workflow,
    /node --test tests\/agent-skills\/gas-city-coordinator\.test\.mjs/,
  );
  assert.match(workflow, /Frozen Taskmaster archive integrity/);
  assert.match(workflow, /Frozen Aegis archive integrity/);
  assert.doesNotMatch(workflow, /check-aegis\.py --witness/);
  assert.doesNotMatch(workflow, /AEGIS_WITNESS/);
});
