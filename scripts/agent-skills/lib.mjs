import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { blockingEligibleCategories, validateRoutingConfig } from "./routing.mjs";
import { verifyBlockingReceipts } from "./receipts.mjs";

const SKILL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REVIEW_ID = /^[a-z0-9][a-z0-9._-]*$/;
const SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
// RFC 3339 profile shared with review-result.schema.json: explicit zone and
// seconds, optional fractional seconds, no leap seconds (legacy compatibility).
const REVIEW_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})[Tt](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:[Zz]|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

function isReviewTimestamp(value) {
  if (typeof value !== "string") return false;
  const match = REVIEW_TIMESTAMP.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Date.parse normalizes impossible dates such as February 30; check the
  // calendar directly, including years 0000..0099 and leap-century boundaries.
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

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
      { cause: error },
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

// Ask root's own repository about each literal path. Quiet mode uses only
// Git's status, so unusual filenames need no output decoding. Disconnecting
// stdin avoids managed-worker pipe hangs; no writable scratch root is needed.
// Tracked paths never count as ignored. Any missing answer discards the whole
// result, and all calls share the original five-second budget.
function gitIgnoredPaths(root, relativePaths, errors) {
  if (relativePaths.length === 0) return new Set();
  const workTree = path.resolve(root);
  const ignored = new Set();
  const deadline = performance.now() + 5000;
  const unavailable = (reason) => {
    errors.push(
      `skill roots cannot be checked against git ignore rules (${reason})`,
    );
    return new Set();
  };
  for (const relativePath of relativePaths) {
    const timeout = Math.ceil(deadline - performance.now());
    if (timeout <= 0) return unavailable("git ignore checks timed out");
    const result = spawnSync(
      "git",
      [
        `--git-dir=${path.join(workTree, ".git")}`,
        `--work-tree=${workTree}`,
        "check-ignore",
        "--quiet",
        "--",
        relativePath,
      ],
      {
        cwd: workTree,
        encoding: "utf8",
        stdio: ["ignore", "ignore", "pipe"],
        timeout,
        killSignal: "SIGKILL",
      },
    );
    // Status 1 is a real answer (not ignored), never a subprocess error.
    if (result.error || (result.status !== 0 && result.status !== 1)) {
      return unavailable(
        result.error?.message ??
          (result.stderr?.trim().split("\n")[0] || `git exited ${result.status}`),
      );
    }
    if (result.status === 0) ignored.add(relativePath);
  }
  return ignored;
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
  if (!isReviewTimestamp(result.generatedAt)) {
    errors.push("generatedAt must be an RFC 3339 timestamp with a valid date, seconds and timezone (no leap seconds)");
  }
  if (typeof result.headSha !== "string" || !SHA.test(result.headSha)) {
    errors.push("headSha must be a full lowercase Git SHA");
  }

  if (!Array.isArray(result.findings)) {
    errors.push("findings must be an array");
  } else {
    if (result.verdict === "not-applicable" && result.findings.length > 0) {
      errors.push("not-applicable reviews must have no findings");
    }
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
      if (finding.blocking === true && !blockingEligibleCategories.includes(finding.category)) {
        errors.push(`${prefix} blocking finding must use a deterministic allowlisted category`);
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
      if (isRecord(item)) {
        for (const key of Object.keys(item)) {
          if (key !== "kind" && key !== "path") {
            errors.push(`evidence[${index}] has unexpected property: ${key}`);
          }
        }
      }
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
  errors.push(...validateRoutingConfig({ catalog, reviewMap }));
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

  const unregistered = [];
  for (const skillId of directoryEntryNames(
    path.join(root, catalog.canonicalRoot),
    "canonical skill root",
    errors,
  )) {
    if (!skillIds.has(skillId)) {
      unregistered.push({
        relativePath: `${catalog.canonicalRoot}/${skillId}`,
        error: `unregistered canonical skill directory: ${skillId}`,
      });
    }
  }
  for (const skillId of directoryEntryNames(
    path.join(root, catalog.codexRoot),
    "Codex skill root",
    errors,
  )) {
    if (!skillIds.has(skillId)) {
      unregistered.push({
        relativePath: `${catalog.codexRoot}/${skillId}`,
        error: `unregistered Codex skill link: ${skillId}`,
      });
    }
  }
  // Gas City installs its own skills into both roots on every machine, and
  // .gitignore keeps them out of the repository, so they need no registration.
  const ignored = gitIgnoredPaths(
    root,
    unregistered.map((entry) => entry.relativePath),
    errors,
  );
  for (const entry of unregistered) {
    if (!ignored.has(entry.relativePath)) errors.push(entry.error);
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

const INGEST_ROUTE = {
  command: '/home/loucmane/gascity/bin/gc',
  city: '/home/loucmane/gascity/city',
  rig: 'blog',
}

function ingestionPath(root, value, directory, label, required = false) {
  if (typeof value !== 'string' || !value || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error(`${label} must be a non-empty path without control characters`)
  }
  const target = path.resolve(root, value)
  const relation = path.relative(path.resolve(root, directory), target)
  if (
    !relation ||
    relation === '..' ||
    relation.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relation)
  ) {
    throw new Error(`${label} must be beneath ${directory}`)
  }
  // Reject links in every component, including reports/ or docs/ themselves.
  // This also prevents a custom worklog from writing frozen workflow state.
  let current = root
  const parts = path.relative(root, target).split(path.sep)
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part)
    let stat
    try {
      stat = fs.lstatSync(current)
    } catch (error) {
      if (!required && error.code === 'ENOENT') continue
      throw error
    }
    if (stat.isSymbolicLink()) throw new Error(`${label} must not traverse symlinks`)
    if (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile()) {
      throw new Error(`${label} must name a regular file beneath directories`)
    }
    if (!required && index === parts.length - 1 && stat.nlink > 1) {
      throw new Error(`${label} must not be a hard-linked file`)
    }
  }
  return target
}

function markdownCode(value) {
  const ticks = '`'.repeat(Math.max(0, ...(value.match(/`+/g) ?? []).map((run) => run.length)) + 1)
  return `${ticks} ${value} ${ticks}`
}

export function buildBeadsIngestPlan(options) {
  return buildIngestPlan(options)
}

function buildIngestPlan(
  {
    root = process.cwd(),
    resultPath,
    result: suppliedResult,
    bead,
    worklog = `docs/worklog/${bead}.md`,
    city = INGEST_ROUTE.city,
    rig = INGEST_ROUTE.rig,
  } = {},
  verifyEvidence = false,
) {
  if (typeof bead !== 'string' || !/^[a-z0-9]+-[a-z0-9][a-z0-9._-]*$/.test(bead)) {
    throw new Error('--bead must be a valid bead ID')
  }
  if (typeof rig !== 'string' || !SKILL_ID.test(rig)) throw new Error('--rig must be a rig name')
  if (typeof city !== 'string' || !path.isAbsolute(city) || /[\x00-\x1f\x7f]/.test(city)) {
    throw new Error('--city must be an absolute path without control characters')
  }
  root = path.resolve(root)
  const absoluteResult = ingestionPath(
    root,
    resultPath,
    'reports/agent-skills',
    'review result',
    suppliedResult === undefined,
  )
  // Offline contract checks can plan an envelope without writing evidence.
  // Its hash describes this serialization, not a persisted file or receipt.
  const bytes = suppliedResult === undefined
    ? fs.readFileSync(absoluteResult)
    : Buffer.from(`${JSON.stringify(suppliedResult, null, 2)}\n`)
  const result = JSON.parse(bytes.toString('utf8'))
  const errors = validateReviewResult(result)
  if (errors.length) throw new Error(errors.join('; '))
  // Verify the same parsed bytes used by the plan/hash, never a second read.
  // The public offline builder remains structural for historical fixtures.
  const deterministicReceipts = verifyEvidence ? verifyBlockingReceipts(result, { root }) : []
  const absoluteWorklog = ingestionPath(root, worklog, 'docs/worklog', 'worklog')
  const findings = { bySeverity: { info: 0, warning: 0, error: 0 }, blocking: 0, advisory: 0 }
  for (const finding of result.findings) {
    findings.bySeverity[finding.severity]++
    findings[finding.blocking ? 'blocking' : 'advisory']++
  }
  const receipt = {
    skill: result.skill,
    reviewId: result.reviewId,
    headSha: result.headSha,
    mode: result.mode,
    findings,
    evidence: relative(root, absoluteResult),
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
  // Beads metadata keys must match ^[a-zA-Z_][a-zA-Z0-9_./]*$, so hyphens become
  // underscores. Execution compares the stored skill and review ID exactly, so a
  // collision (a-b versus a_b) is refused rather than treated as a duplicate.
  const metadataKey = `skills.review.${result.skill}.${result.reviewId}`.replaceAll('-', '_')
  const counts = `info=${findings.bySeverity.info}, warning=${findings.bySeverity.warning}, error=${findings.bySeverity.error}; blocking=${findings.blocking}, advisory=${findings.advisory}`
  // Copy identifiers/counts, not free-form findings or summary, into the sinks.
  const summary = `Recorded advisory ${result.skill} review ${result.reviewId}; head=${result.headSha}; verdict=${result.verdict}; ${counts}; evidence=${receipt.evidence}; sha256=${receipt.sha256}`
  return {
    bead,
    metadataKey,
    receipt,
    ...(verifyEvidence ? { deterministicReceipts } : {}),
    summary,
    gcArgv: [
      INGEST_ROUTE.command,
      '--city',
      city,
      '--rig',
      rig,
      'bd',
      'update',
      bead,
      '--append-notes',
      summary,
      '--set-metadata',
      `${metadataKey}=${JSON.stringify(receipt)}`,
    ],
    worklog: {
      path: relative(root, absoluteWorklog),
      entry: [
        '',
        '',
        `### Skill review: ${result.skill} / ${result.reviewId}`,
        '',
        'Classification: internal project evidence.',
        '',
        `- Bead: ${markdownCode(bead)}`,
        `- Review ID: ${markdownCode(result.reviewId)}`,
        `- Head SHA: ${markdownCode(result.headSha)}`,
        `- Mode: advisory; verdict: ${result.verdict}`,
        `- Findings: ${counts}`,
        `- Evidence: ${markdownCode(receipt.evidence)}`,
        `- Result SHA-256: ${markdownCode(receipt.sha256)}`,
        `- Beads metadata: ${markdownCode(metadataKey)}`,
        '- This receipt records validated structure and supplied claims; it does not verify evidence truth.',
        '',
      ].join('\n'),
    },
  }
}

function runIngestionCommand(argv, root, runner) {
  const outcome = runner(argv[0], argv.slice(1), {
    cwd: root,
    shell: false,
    encoding: 'utf8',
    timeout: 30000,
    killSignal: 'SIGKILL',
    env: {
      GC_HOME: '/home/loucmane/gascity/home',
      PATH: '/home/loucmane/gascity/bin:/usr/local/bin:/usr/bin:/bin',
    },
  })
  if (outcome.error || outcome.status !== 0) {
    // The last stderr line carries Beads validation errors (e.g. a rejected key).
    const detail =
      typeof outcome.stderr === 'string'
        ? outcome.stderr.trim().split('\n').at(-1).slice(0, 300)
        : ''
    throw new Error(
      `Beads ${argv[6]} did not complete successfully (${outcome.error?.message ?? outcome.signal ?? outcome.status})${detail ? `: ${detail}` : ''}; inspect the bead before retrying`,
    )
  }
  return outcome.stdout
}

export function ingestReviewResult({
  root = process.cwd(),
  execute = false,
  runner = spawnSync,
  ...options
} = {}) {
  if (Object.hasOwn(options, 'result')) {
    throw new Error('ingestion requires file-backed evidence; in-memory results are for buildBeadsIngestPlan only')
  }
  root = path.resolve(root)
  const plan = buildIngestPlan({ root, ...options }, true)
  if (!execute) return { status: 'dry-run', ...plan }

  const showArgv = [...plan.gcArgv.slice(0, 5), 'bd', 'show', plan.bead, '--json']
  const shown = JSON.parse(runIngestionCommand(showArgv, root, runner))
  const record = Array.isArray(shown) && shown.length === 1 ? shown[0] : shown
  if (
    !isRecord(record) ||
    record.id !== plan.bead ||
    (record.metadata !== undefined && !isRecord(record.metadata))
  ) {
    throw new Error('Beads show must return the requested bead and valid metadata')
  }
  const metadata = record.metadata ?? {}
  if (Object.hasOwn(metadata, plan.metadataKey)) {
    const prior =
      typeof metadata[plan.metadataKey] === 'string'
        ? JSON.parse(metadata[plan.metadataKey])
        : metadata[plan.metadataKey]
    // Every receipt field derives from the result bytes and path, so only an
    // identical receipt is a duplicate; anything else (including a key collision
    // or a malformed receipt) is refused.
    if (!isDeepStrictEqual(prior, plan.receipt)) {
      throw new Error(
        `Review receipt conflict for ${plan.metadataKey}: stored receipt differs from this result`,
      )
    }
    return { status: 'already ingested', ...plan }
  }

  // Check local writability before the remote mutation. The two sinks are not
  // transactional; an append error after the update needs coordinator repair.
  const logPath = ingestionPath(root, plan.worklog.path, 'docs/worklog', 'worklog')
  let writable = logPath
  while (!fs.existsSync(writable)) writable = path.dirname(writable)
  fs.accessSync(writable, fs.constants.W_OK)
  runIngestionCommand(plan.gcArgv, root, runner)
  try {
    ingestionPath(root, plan.worklog.path, 'docs/worklog', 'worklog')
    fs.mkdirSync(path.dirname(logPath), { recursive: true })
    fs.appendFileSync(logPath, plan.worklog.entry, 'utf8')
  } catch (error) {
    throw new Error(
      `Beads receipt recorded, but worklog append did not complete: ${error.message}. Coordinator must reconcile ${plan.worklog.path}; an equal-hash retry writes nothing.`,
      { cause: error },
    )
  }
  return { status: 'ingested', ...plan }
}
