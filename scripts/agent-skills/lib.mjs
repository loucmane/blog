import fs from "node:fs";
import path from "node:path";

const SKILL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REVIEW_ID = /^[a-z0-9][a-z0-9._-]*$/;
const SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function relative(root, target) {
  return path.relative(root, target).split(path.sep).join("/") || ".";
}

function readJsonCompatibleYaml(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `${filePath}: expected JSON-compatible YAML (${error.message})`,
    );
  }
}

function resolveRepositoryPath(root, value, label, errors) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    path.isAbsolute(value)
  ) {
    errors.push(`${label} must be a non-empty repository-relative path`);
    return null;
  }
  const resolved = path.resolve(root, value);
  const relation = path.relative(root, resolved);
  if (relation.startsWith("..") || path.isAbsolute(relation)) {
    errors.push(`${label} escapes the repository: ${value}`);
    return null;
  }
  return resolved;
}

function parseFrontmatter(filePath, errors) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    errors.push(`${filePath}: ${error.message}`);
    return {};
  }
  const lines = content.split(/\r?\n/);
  if (lines[0] !== "---") {
    errors.push(`${filePath}: SKILL.md must start with YAML frontmatter`);
    return {};
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    errors.push(`${filePath}: SKILL.md frontmatter is not closed`);
    return {};
  }
  const metadata = {};
  for (const line of lines.slice(1, end)) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
    if (!match) {
      errors.push(`${filePath}: unsupported frontmatter line: ${line}`);
      continue;
    }
    metadata[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return metadata;
}

function directoryEntryNames(directory, label, errors) {
  try {
    return fs
      .readdirSync(directory, { withFileTypes: true })
      .map((entry) => entry.name);
  } catch (error) {
    errors.push(`${label} cannot be enumerated (${error.message})`);
    return [];
  }
}

export function validateReviewResult(result) {
  const errors = [];
  if (!isRecord(result)) return ["review result must be an object"];

  const allowed = new Set([
    "schemaVersion",
    "reviewId",
    "skill",
    "mode",
    "verdict",
    "summary",
    "generatedAt",
    "headSha",
    "findings",
    "evidence",
  ]);
  for (const key of Object.keys(result)) {
    if (!allowed.has(key))
      errors.push(`unexpected review-result property: ${key}`);
  }

  if (result.schemaVersion !== 1) errors.push("schemaVersion must equal 1");
  if (typeof result.reviewId !== "string" || !REVIEW_ID.test(result.reviewId)) {
    errors.push("reviewId must use lowercase identifier characters");
  }
  if (typeof result.skill !== "string" || !SKILL_ID.test(result.skill)) {
    errors.push("skill must be a lowercase hyphenated id");
  }
  if (result.mode !== "advisory") errors.push("mode must remain advisory");
  if (!["pass", "warn", "fail", "not-applicable"].includes(result.verdict)) {
    errors.push("verdict is invalid");
  }
  if (typeof result.summary !== "string" || result.summary.trim() === "") {
    errors.push("summary must be a non-empty string");
  }
  if (
    typeof result.generatedAt !== "string" ||
    Number.isNaN(Date.parse(result.generatedAt))
  ) {
    errors.push("generatedAt must be an ISO-8601 timestamp");
  }
  if (typeof result.headSha !== "string" || !SHA.test(result.headSha)) {
    errors.push("headSha must be a full lowercase Git SHA");
  }

  if (!Array.isArray(result.findings)) {
    errors.push("findings must be an array");
  } else {
    result.findings.forEach((finding, index) => {
      const prefix = `findings[${index}]`;
      if (!isRecord(finding)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      const allowedFinding = new Set([
        "id",
        "severity",
        "category",
        "message",
        "subjective",
        "blocking",
        "evidence",
      ]);
      for (const key of Object.keys(finding)) {
        if (!allowedFinding.has(key))
          errors.push(`${prefix} has unexpected property: ${key}`);
      }
      if (typeof finding.id !== "string" || !REVIEW_ID.test(finding.id)) {
        errors.push(`${prefix}.id is invalid`);
      }
      if (!["info", "warning", "error"].includes(finding.severity)) {
        errors.push(`${prefix}.severity is invalid`);
      }
      if (
        typeof finding.category !== "string" ||
        finding.category.trim() === ""
      ) {
        errors.push(`${prefix}.category must be non-empty`);
      }
      if (
        typeof finding.message !== "string" ||
        finding.message.trim() === ""
      ) {
        errors.push(`${prefix}.message must be non-empty`);
      }
      if (typeof finding.subjective !== "boolean")
        errors.push(`${prefix}.subjective must be boolean`);
      if (typeof finding.blocking !== "boolean")
        errors.push(`${prefix}.blocking must be boolean`);
      if (finding.subjective === true && finding.blocking === true) {
        errors.push(`${prefix} cannot make a subjective finding blocking`);
      }
      if (
        !Array.isArray(finding.evidence) ||
        finding.evidence.some(
          (item) => typeof item !== "string" || item.length === 0,
        )
      ) {
        errors.push(`${prefix}.evidence must be an array of non-empty strings`);
      }
    });
  }

  if (!Array.isArray(result.evidence) || result.evidence.length === 0) {
    errors.push("evidence must contain at least one item");
  } else {
    result.evidence.forEach((item, index) => {
      if (
        !isRecord(item) ||
        !["command", "file", "url"].includes(item.kind) ||
        typeof item.path !== "string" ||
        item.path.length === 0
      ) {
        errors.push(
          `evidence[${index}] must contain a valid kind and non-empty path`,
        );
      }
    });
  }

  return errors;
}

export function validatePlatform({ root = process.cwd() } = {}) {
  const errors = [];
  const load = (relativePath) => {
    const filePath = path.join(root, relativePath);
    try {
      return readJsonCompatibleYaml(filePath);
    } catch (error) {
      errors.push(error.message);
      return null;
    }
  };

  const catalog = load("config/agent-skills/catalog.yaml");
  const reviewMap = load("config/agent-skills/review-map.yaml");
  const upstream = load("config/agent-skills/upstream.lock.json");
  const schema = load("schemas/agent-skills/review-result.schema.json");
  if (![catalog, reviewMap, upstream, schema].every(isRecord)) {
    return {
      passed: false,
      errors,
      summary: { skills: 0, routes: 0, upstreamEntries: 0 },
    };
  }

  if (catalog.schemaVersion !== 1)
    errors.push("catalog.schemaVersion must equal 1");
  if (catalog.canonicalRoot !== ".claude/skills")
    errors.push("catalog.canonicalRoot must be .claude/skills");
  if (catalog.codexRoot !== ".agents/skills")
    errors.push("catalog.codexRoot must be .agents/skills");
  if (
    catalog.reviewResultSchema !==
    "schemas/agent-skills/review-result.schema.json"
  ) {
    errors.push("catalog.reviewResultSchema must reference the project schema");
  }
  if (catalog.reportsRoot !== "reports/agent-skills")
    errors.push("catalog.reportsRoot must be reports/agent-skills");
  if (catalog.policy?.subjectiveFindings !== "advisory")
    errors.push("subjective findings must remain advisory");
  if (catalog.policy?.deterministicFindings !== "blocking-eligible") {
    errors.push("deterministic findings must be blocking-eligible");
  }
  const deterministicChecks = new Set(
    catalog.policy?.deterministicChecks ?? [],
  );
  if (deterministicChecks.size === 0)
    errors.push("catalog must declare deterministic checks");

  const skills = Array.isArray(catalog.skills) ? catalog.skills : [];
  if (skills.length === 0)
    errors.push("catalog must register at least one skill");
  const skillIds = new Set();
  const upstreamIds = new Set(
    (Array.isArray(upstream.entries) ? upstream.entries : []).map(
      (entry) => entry?.id,
    ),
  );
  for (const skill of skills) {
    if (
      !isRecord(skill) ||
      typeof skill.id !== "string" ||
      !SKILL_ID.test(skill.id)
    ) {
      errors.push("catalog skill id must be lowercase and hyphenated");
      continue;
    }
    if (skillIds.has(skill.id))
      errors.push(`duplicate catalog skill: ${skill.id}`);
    skillIds.add(skill.id);

    const expectedEntry = `${catalog.canonicalRoot}/${skill.id}/SKILL.md`;
    const expectedLink = `${catalog.codexRoot}/${skill.id}`;
    if (skill.entrypoint !== expectedEntry)
      errors.push(`${skill.id}: entrypoint must be ${expectedEntry}`);
    if (skill.codexLink !== expectedLink)
      errors.push(`${skill.id}: codexLink must be ${expectedLink}`);

    const entryPath = resolveRepositoryPath(
      root,
      skill.entrypoint,
      `${skill.id}.entrypoint`,
      errors,
    );
    const linkPath = resolveRepositoryPath(
      root,
      skill.codexLink,
      `${skill.id}.codexLink`,
      errors,
    );
    if (entryPath) {
      const metadata = parseFrontmatter(entryPath, errors);
      if (metadata.name !== skill.id)
        errors.push(`${skill.id}: SKILL.md name must match the catalog id`);
      if (
        typeof metadata.description !== "string" ||
        metadata.description.length < 40 ||
        metadata.description.includes("TODO")
      ) {
        errors.push(
          `${skill.id}: SKILL.md description must be complete and trigger-oriented`,
        );
      }
      const openaiMetadata = path.join(
        path.dirname(entryPath),
        "agents/openai.yaml",
      );
      if (
        !fs.existsSync(openaiMetadata) ||
        !fs.statSync(openaiMetadata).isFile()
      ) {
        errors.push(`${skill.id}: agents/openai.yaml is missing`);
      }
    }
    if (linkPath) {
      let stat;
      try {
        stat = fs.lstatSync(linkPath);
      } catch (error) {
        errors.push(`${skill.id}: Codex link is missing (${error.message})`);
      }
      if (stat && !stat.isSymbolicLink()) {
        errors.push(`${skill.id}: Codex path must be a symlink`);
      } else if (stat) {
        const target = fs.readlinkSync(linkPath);
        if (path.isAbsolute(target))
          errors.push(`${skill.id}: Codex symlink must be relative`);
        const resolvedTarget = path.resolve(path.dirname(linkPath), target);
        const expectedTarget = path.resolve(
          root,
          catalog.canonicalRoot,
          skill.id,
        );
        if (resolvedTarget !== expectedTarget)
          errors.push(
            `${skill.id}: Codex symlink resolves outside its canonical skill`,
          );
      }
    }

    if (skill.provenance?.type === "upstream" && !upstreamIds.has(skill.id)) {
      errors.push(`${skill.id}: upstream provenance requires a lock entry`);
    }
    if (!["project-authored", "upstream"].includes(skill.provenance?.type)) {
      errors.push(`${skill.id}: provenance type is invalid`);
    }
  }

  for (const skillId of directoryEntryNames(
    path.join(root, catalog.canonicalRoot),
    "canonical skill root",
    errors,
  )) {
    if (!skillIds.has(skillId)) {
      errors.push(`unregistered canonical skill directory: ${skillId}`);
    }
  }
  for (const skillId of directoryEntryNames(
    path.join(root, catalog.codexRoot),
    "Codex skill root",
    errors,
  )) {
    if (!skillIds.has(skillId)) {
      errors.push(`unregistered Codex skill link: ${skillId}`);
    }
  }

  if (reviewMap.schemaVersion !== 1)
    errors.push("reviewMap.schemaVersion must equal 1");
  if (reviewMap.defaultMode !== "advisory")
    errors.push("reviewMap.defaultMode must remain advisory");
  const routes = Array.isArray(reviewMap.routes) ? reviewMap.routes : [];
  if (routes.length === 0)
    errors.push("review map must contain at least one route");
  const routeIds = new Set();
  for (const route of routes) {
    if (
      !isRecord(route) ||
      typeof route.id !== "string" ||
      !SKILL_ID.test(route.id)
    ) {
      errors.push("review route id must be lowercase and hyphenated");
      continue;
    }
    if (routeIds.has(route.id))
      errors.push(`duplicate review route: ${route.id}`);
    routeIds.add(route.id);
    if (route.mode !== "advisory")
      errors.push(`${route.id}: review mode must remain advisory`);
    if (!Array.isArray(route.match) || route.match.length === 0)
      errors.push(`${route.id}: match paths are required`);
    for (const skillId of route.skills ?? []) {
      if (!skillIds.has(skillId))
        errors.push(`${route.id}: references unknown skill ${skillId}`);
    }
    for (const check of route.requiredChecks ?? []) {
      if (!deterministicChecks.has(check))
        errors.push(`${route.id}: undeclared deterministic check ${check}`);
    }
  }

  if (upstream.schemaVersion !== 1)
    errors.push("upstream lock schemaVersion must equal 1");
  const lockIds = new Set();
  for (const entry of Array.isArray(upstream.entries) ? upstream.entries : []) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      !SKILL_ID.test(entry.id)
    ) {
      errors.push("upstream lock entry id is invalid");
      continue;
    }
    if (lockIds.has(entry.id))
      errors.push(`duplicate upstream lock entry: ${entry.id}`);
    lockIds.add(entry.id);
    if (typeof entry.source !== "string" || entry.source.length === 0)
      errors.push(`${entry.id}: upstream source is required`);
    if (typeof entry.revision !== "string" || entry.revision.length === 0)
      errors.push(`${entry.id}: immutable revision is required`);
    if (typeof entry.sha256 !== "string" || !SHA256.test(entry.sha256))
      errors.push(`${entry.id}: sha256 digest is invalid`);
  }

  const requiredSchemaFields = new Set(schema.required ?? []);
  for (const field of [
    "schemaVersion",
    "reviewId",
    "skill",
    "mode",
    "verdict",
    "summary",
    "generatedAt",
    "headSha",
    "findings",
    "evidence",
  ]) {
    if (!requiredSchemaFields.has(field))
      errors.push(`review-result schema must require ${field}`);
  }
  if (schema.additionalProperties !== false)
    errors.push("review-result schema must reject additional properties");
  if (schema.properties?.mode?.const !== "advisory")
    errors.push("review-result schema mode must remain advisory");
  if (
    schema.properties?.findings?.items?.properties?.subjective?.type !==
    "boolean"
  ) {
    errors.push("review-result schema must classify subjective findings");
  }
  if (
    schema.properties?.findings?.items?.properties?.blocking?.type !== "boolean"
  ) {
    errors.push("review-result schema must classify blocking findings");
  }

  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  if (!gitignore.split(/\r?\n/).includes("reports/agent-skills/")) {
    errors.push("reports/agent-skills/ must be ignored");
  }
  const prettierIgnore = fs.readFileSync(
    path.join(root, ".prettierignore"),
    "utf8",
  );
  if (!prettierIgnore.split(/\r?\n/).includes("config/agent-skills/*.yaml")) {
    errors.push(
      "JSON-compatible YAML contracts must be protected from YAML reformatting",
    );
  }
  const packageJson = load("package.json");
  if (
    packageJson?.scripts?.["ci:agent-skills"] !==
    "node scripts/agent-skills/validate-platform.mjs && node --test tests/agent-skills/*.test.mjs"
  ) {
    errors.push(
      "package.json must expose the deterministic ci:agent-skills command",
    );
  }
  const workflow = fs.readFileSync(
    path.join(root, ".github/workflows/ci.yml"),
    "utf8",
  );
  if (
    !workflow.includes("id: agent_skills") ||
    !workflow.includes("AGENT_SKILLS: ${{ steps.agent_skills.outcome }}")
  ) {
    errors.push("CI governance must enforce the cross-agent skill checks");
  }

  return {
    passed: errors.length === 0,
    errors,
    summary: {
      skills: skills.length,
      routes: routes.length,
      upstreamEntries: Array.isArray(upstream.entries)
        ? upstream.entries.length
        : 0,
    },
  };
}

export function buildAegisIngestCommand({ root = process.cwd(), resultPath }) {
  const absoluteResult = path.resolve(root, resultPath);
  const reportsRoot = path.resolve(root, "reports/agent-skills");
  const relation = path.relative(reportsRoot, absoluteResult);
  if (relation.startsWith("..") || path.isAbsolute(relation)) {
    throw new Error("review result must be beneath reports/agent-skills");
  }
  const result = JSON.parse(fs.readFileSync(absoluteResult, "utf8"));
  const errors = validateReviewResult(result);
  if (errors.length > 0) throw new Error(errors.join("; "));
  const evidence = relative(root, absoluteResult);
  return {
    command: "./.aegis/bin/aegis",
    args: [
      "log",
      "--target-dir",
      ".",
      "--handler",
      `agent-skill:${result.skill}`,
      "--event-class",
      "verification",
      "--evidence",
      evidence,
      "--note",
      `Recorded advisory ${result.skill} review ${result.reviewId} with verdict ${result.verdict}`,
    ],
  };
}
