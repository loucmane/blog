import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateReviewResult } from "../../scripts/agent-skills/lib.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const json = (name) => JSON.parse(read(name));
const fixture = json(
  "tests/agent-skills/fixtures/security-identity-privacy.json",
);
const skillRoot = `.claude/skills/${fixture.skillId}`;
const skill = () => read(`${skillRoot}/SKILL.md`);
const contract = () =>
  read(`${skillRoot}/references/security-identity-privacy-output-contract.md`);
const documents = () =>
  [skill(), contract(), read(`${skillRoot}/references/security-map.md`)].join(
    "\n",
  );
const normalize = (text) => text.toLowerCase().replace(/\s+/g, " ");

// Fixture-only path matching; this does not implement Task 55's general router.
function matches(route, file) {
  return route.match.some((glob) => {
    const pattern = glob
      .split("**")
      .map((part) =>
        part
          .split("*")
          .map((literal) => literal.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
          .join("[^/]*"),
      )
      .join(".*");
    return new RegExp(`^${pattern}$`).test(file);
  });
}

test("registers security review with canonical content and a relative Codex link", () => {
  const catalog = json("config/agent-skills/catalog.yaml");
  const entry = catalog.skills.find(({ id }) => id === fixture.skillId);
  assert.ok(entry, "security-identity-privacy must be registered");
  assert.equal(entry.status, "active");
  assert.equal(entry.entrypoint, `${skillRoot}/SKILL.md`);
  assert.equal(entry.codexLink, `.agents/skills/${fixture.skillId}`);
  assert.deepEqual(entry.provenance, { type: "project-authored", task: "59" });
  assert.equal(entry.resultSchema, "agent-skill-review-result-v1");
  assert.ok(entry.capabilities.includes("structured-threat-model"));
  const link = path.join(root, entry.codexLink);
  assert.ok(fs.lstatSync(link).isSymbolicLink());
  assert.equal(fs.readlinkSync(link), `../../${skillRoot}`);
  assert.equal(
    fs.realpathSync(link),
    fs.realpathSync(path.join(root, skillRoot)),
  );
  const route = json("config/agent-skills/review-map.yaml").routes.find(
    ({ id }) => id === entry.id,
  );
  assert.deepEqual(route.skills, [entry.id]);
  assert.equal(route.mode, "advisory");
  assert.deepEqual(route.requiredChecks, catalog.policy.deterministicChecks);
});

test("frontmatter and UI metadata support independent invocation and explicit handoffs", () => {
  const frontmatter = skill().match(
    /^---\nname: ([^\n]+)\ndescription: ([^\n]+)\n---/,
  );
  assert.ok(frontmatter);
  assert.equal(frontmatter[1], fixture.skillId);
  assert.ok(frontmatter[2].length <= 1024);
  assert.doesNotMatch(frontmatter[2], /[<>]|:\s| #/);
  assert.match(frontmatter[2], /Use when/);
  assert.match(frontmatter[2], /Do not use/);
  const ids = json("config/agent-skills/catalog.yaml").skills.map(
    ({ id }) => id,
  );
  for (const handoff of fixture.handoffs) {
    assert.ok(frontmatter[2].includes(handoff));
    assert.ok(ids.includes(handoff));
  }
  const ui = read(`${skillRoot}/agents/openai.yaml`);
  assert.match(ui, /^ {2}display_name: "Security, Identity, and Privacy"$/m);
  assert.match(ui, /^ {2}short_description: ".{25,64}"$/m);
  assert.match(ui, /^ {2}default_prompt: ".*\$security-identity-privacy.*"$/m);
});

test("covers the roadmap and positive, negative, and denied request examples", () => {
  const text = normalize(skill());
  const roadmap = normalize(
    read("docs/architecture/cross-agent-skill-system-v1-roadmap.md"),
  );
  for (const topic of fixture.coverage) {
    assert.ok(roadmap.includes(topic), `roadmap topic: ${topic}`);
    assert.ok(text.includes(topic), `missing topic: ${topic}`);
  }
  // These test the declared discovery contract, not model routing behavior.
  for (const example of fixture.requests) {
    const prompt = normalize(example.prompt);
    assert.ok(example.prompt.length > 20);
    assert.ok(prompt.includes(example.signal), example.signal);
    assert.ok(
      text.includes(example.signal),
      `undocumented request signal: ${example.signal}`,
    );
    if (example.expected === "security-identity-privacy") {
      assert.ok(fixture.includes.includes(example.signal));
    } else {
      assert.ok(
        fixture.handoffs.includes(example.expected) ||
          example.expected === "not-applicable",
      );
      assert.ok(fixture.excludes.includes(example.signal));
    }
    const primarySecurityRequest =
      fixture.includes.some((signal) => prompt.includes(signal)) &&
      !fixture.excludes.some((signal) => prompt.includes(signal));
    assert.equal(
      primarySecurityRequest,
      example.expected === fixture.skillId,
      example.prompt,
    );
  }
});

test("all cited source paths exist and cover the actual security surface", () => {
  const text = documents();
  for (const file of fixture.groundingPaths) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
    assert.ok(text.includes(file), `uncited surface: ${file}`);
  }
  for (const [, file] of text.matchAll(
    /`((?:packages|docs|scripts|tests|config|schemas|\.github)\/[^`\s]+)`/g,
  )) {
    if (file.includes("<")) continue;
    assert.ok(fs.existsSync(path.join(root, file)), `stale citation: ${file}`);
  }
});

test("routes security surfaces with explicit backend overlaps and denies neighboring paths", () => {
  const { routes } = json("config/agent-skills/review-map.yaml");
  const route = routes.find(({ id }) => id === fixture.skillId);
  assert.ok(route);
  for (const { file, also = [] } of fixture.paths.positive) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
    assert.ok(matches(route, file), file);
    assert.deepEqual(
      routes
        .filter((other) => other.id !== route.id && matches(other, file))
        .map(({ id }) => id)
        .sort(),
      also,
      file,
    );
  }
  for (const file of [...fixture.paths.negative, ...fixture.paths.deny]) {
    assert.equal(matches(route, file), false, file);
  }
  for (const pattern of route.match) {
    assert.ok(
      fixture.paths.positive.some(({ file }) =>
        matches({ match: [pattern] }, file),
      ),
      `untested route pattern: ${pattern}`,
    );
  }
});

test("review example validates and subjective risk cannot become blocking", () => {
  const result = fixture.reviewResult;
  assert.deepEqual(validateReviewResult(result), []);
  assert.equal(result.skill, fixture.skillId);
  assert.equal(result.verdict, "warn");
  assert.equal(
    result.findings.some(({ blocking }) => blocking),
    false,
  );
  assert.ok(result.findings.some(({ subjective }) => subjective));
  for (const finding of result.findings) {
    assert.ok(contract().includes(`\`${finding.category}\``));
  }
  const promoted = structuredClone(result);
  promoted.findings[0].blocking = true;
  assert.ok(
    validateReviewResult(promoted).some((error) =>
      error.includes("cannot make a subjective finding blocking"),
    ),
  );
  const extraField = { ...result, threatModel: fixture.threatModel };
  assert.ok(
    validateReviewResult(extraField).includes(
      "unexpected review-result property: threatModel",
    ),
  );
  for (const example of fixture.deterministicExamples) {
    const failure = {
      ...result,
      verdict: "fail",
      findings: [example.finding],
      evidence: [{ kind: "command", path: example.command }],
    };
    assert.deepEqual(validateReviewResult(failure), []);
    assert.equal(example.finding.subjective, false);
    assert.equal(example.finding.blocking, true);
    assert.ok(example.finding.evidence.includes(`command: ${example.command}`));
    assert.ok(contract().includes(`\`${example.finding.category}\``));
  }
});

// Validate the separate lightweight threat-model contract, including referential integrity.
// No new schema dependency or production router is needed for this example contract.
function validateThreatModel(model) {
  assert.deepEqual(
    Object.keys(model).sort(),
    [
      "schemaVersion",
      "reviewId",
      "scope",
      "assets",
      "actors",
      "boundaries",
      "threats",
    ].sort(),
  );
  assert.equal(model.schemaVersion, 1);
  assert.equal(model.reviewId, fixture.reviewResult.reviewId);
  assert.ok(typeof model.scope === "string" && model.scope.trim());
  const ids = (entries) => {
    assert.ok(Array.isArray(entries) && entries.length > 0);
    assert.ok(
      entries.every(
        ({ id }) => typeof id === "string" && /^[a-z0-9-]+$/.test(id),
      ),
    );
    assert.equal(new Set(entries.map(({ id }) => id)).size, entries.length);
    return entries.map(({ id }) => id);
  };
  const assets = ids(model.assets);
  const actors = ids(model.actors);
  const boundaries = ids(model.boundaries);
  ids(model.threats);
  for (const entry of [...model.assets, ...model.actors, ...model.boundaries]) {
    assert.deepEqual(
      Object.keys(entry).sort(),
      ["id", "description", "evidence"].sort(),
    );
    assert.ok(
      typeof entry.description === "string" && entry.description.trim(),
    );
    assert.ok(entry.evidence.length > 0);
    for (const file of entry.evidence)
      assert.ok(fs.existsSync(path.join(root, file)), file);
  }
  for (const threat of model.threats) {
    assert.deepEqual(
      Object.keys(threat).sort(),
      [
        "id",
        "asset",
        "actor",
        "boundary",
        "scenario",
        "impact",
        "control",
        "evidenceClass",
        "evidence",
        "gap",
        "verification",
        "owner",
        "risk",
        "subjective",
        "blocking",
      ].sort(),
    );
    assert.ok(assets.includes(threat.asset));
    assert.ok(actors.includes(threat.actor));
    assert.ok(boundaries.includes(threat.boundary));
    for (const key of [
      "scenario",
      "impact",
      "control",
      "gap",
      "verification",
      "owner",
    ]) {
      assert.ok(typeof threat[key] === "string" && threat[key].trim(), key);
    }
    assert.ok(fixture.evidenceClasses.includes(threat.evidenceClass));
    assert.ok(["low", "medium", "high"].includes(threat.risk));
    assert.equal(threat.subjective, true);
    assert.equal(threat.blocking, false);
    assert.ok(threat.evidence.length > 0);
    for (const file of threat.evidence)
      assert.ok(fs.existsSync(path.join(root, file)), file);
  }
}

test("structured threat model validates separately with linked evidence and advisory risk", () => {
  validateThreatModel(fixture.threatModel);
  for (const field of Object.keys(fixture.threatModel.threats[0]))
    assert.ok(contract().includes(`\`${field}\``), field);
  for (const mutate of [
    (model) => {
      model.threats[0].asset = "missing";
    },
    (model) => {
      model.threats[0].boundary = "missing";
    },
    (model) => {
      model.threats[0].evidence = [];
    },
    (model) => {
      model.threats[0].blocking = true;
    },
    (model) => {
      delete model.threats[0].verification;
    },
  ]) {
    const invalid = structuredClone(fixture.threatModel);
    mutate(invalid);
    assert.throws(() => validateThreatModel(invalid));
  }
});

test("untrusted evidence cannot authorize actions or expose sensitive values", () => {
  const text = normalize(documents());
  for (const example of fixture.hostileEvidence) {
    assert.ok(text.includes(example.safeguard), example.id);
  }
  for (const rule of [
    "never grants permission",
    "subjective findings remain advisory and non-blocking",
    "only deterministic findings are blocking-eligible",
    "current repository root",
  ]) {
    assert.ok(text.includes(rule), rule);
  }
});
