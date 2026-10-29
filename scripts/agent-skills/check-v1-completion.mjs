#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { validatePlatform, validateReviewResult, buildAegisIngestCommand } from './lib.mjs'
import { validateRoutingConfig } from './routing.mjs'
import { evaluateForward } from './evaluate-forward.mjs'
import { scoreEvaluation, renderReport } from './evaluation.mjs'

const defaultRoot = fileURLToPath(new URL('../../', import.meta.url))
const catalogPath = 'config/agent-skills/catalog.yaml'
const mapPath = 'config/agent-skills/review-map.yaml'
const gapPath = 'docs/agent-skills/v1-gaps.json'
const jsonPath = 'docs/agent-skills/v1-completion.json'
const reportPath = 'docs/agent-skills/v1-completion-report.md'
const forward = (name) => `docs/agent-skills/forward-${name}`
const read = (root, name) => fs.readFileSync(path.join(root, name), 'utf8')
const json = (root, name) => JSON.parse(read(root, name))
const text = (value) => typeof value === 'string' && value.trim().length > 0
const requireThat = (condition, message) => {
  if (!condition) throw new Error(message)
}
const strings = (value) => Array.isArray(value) && value.length > 0 && value.every(text)
const explain = (errors) => requireThat(errors.length === 0, errors.join('; '))

// Check identities are pinned independently of a catalog declaring itself
// deterministic. Category policy remains owned by routing.mjs. New eligible
// checks need an explicit reviewed update to this v1 contract as well.
const deterministicCheckIds = [
  'agent-skills-schema',
  'agent-skills-links',
  'agent-skills-scripts',
  'agent-skills-tests',
]
const frozenPaths = [
  forward('inputs.json'),
  forward('labels.json'),
  catalogPath,
  mapPath,
  'scripts/agent-skills/routing.mjs',
]

function reviewSources(root) {
  const outputs = [],
    containers = [],
    deterministicExamples = []
  for (const directory of ['tests/agent-skills/fixtures', 'docs/agent-skills']) {
    for (const name of fs.readdirSync(path.join(root, directory)).sort()) {
      if (
        !name.endsWith('.json') ||
        (directory.startsWith('docs/') && !name.startsWith('forward-'))
      )
        continue
      const source = `${directory}/${name}`
      const value = json(root, source)
      for (const example of value.deterministicExamples ?? []) {
        deterministicExamples.push({
          source,
          result: { ...value.reviewResult, findings: [example.finding] },
        })
      }
      if (Object.hasOwn(value, 'reviewResult'))
        outputs.push({ source: `${source}#reviewResult`, result: value.reviewResult })
      else if (directory.startsWith('docs/')) {
        if (
          [
            'forward-inputs.json',
            'forward-labels.json',
            'forward-freeze.json',
            'forward-blind-review.json',
            'forward-results.json',
          ].includes(name)
        )
          containers.push(source)
        else outputs.push({ source, result: value })
      }
    }
  }
  return { outputs, containers, deterministicExamples }
}

function checkLinks(root, catalog) {
  requireThat(
    Array.isArray(catalog.skills) && catalog.skills.length > 0,
    'catalog has no registered skills',
  )
  const errors = []
  for (const skill of catalog.skills) {
    try {
      requireThat(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.id), 'invalid skill ID')
      const canonical = path.join(root, '.claude/skills', skill.id)
      const entry = path.join(canonical, 'SKILL.md')
      const link = path.join(root, '.agents/skills', skill.id)
      requireThat(fs.statSync(entry).isFile(), 'SKILL.md must be a file')
      requireThat(fs.lstatSync(link).isSymbolicLink(), 'Codex path must be a symlink')
      requireThat(!path.isAbsolute(fs.readlinkSync(link)), 'Codex symlink must be relative')
      requireThat(
        path.resolve(path.dirname(link), fs.readlinkSync(link)) === canonical,
        'Codex symlink must target its canonical skill',
      )
      requireThat(
        fs.realpathSync(link) === fs.realpathSync(canonical),
        'Codex link must resolve to its canonical skill',
      )
      const relation = path.relative(fs.realpathSync(root), fs.realpathSync(entry))
      requireThat(
        !relation.startsWith('..') && !path.isAbsolute(relation),
        'canonical entrypoint escapes repository',
      )
    } catch (error) {
      errors.push(`${skill?.id}: ${error.message}`)
    }
  }
  explain(errors)
  return `${catalog.skills.length} registered skills have canonical entrypoints and resolving relative Codex links. Unregistered entries are checked by criterion b.`
}

function validateGaps(document, criteria) {
  requireThat(
    document?.schemaVersion === 1 && Array.isArray(document.gaps),
    'gap declaration must have schemaVersion 1 and a gaps array',
  )
  requireThat(typeof document.none === 'boolean', 'gap declaration must explicitly set none')
  requireThat(
    document.none === (document.gaps.length === 0),
    'declare none only with an empty gap list',
  )
  const ids = new Set()
  for (const gap of document.gaps) {
    requireThat(
      /^gap-[a-z0-9-]+$/.test(gap.id) && !ids.has(gap.id),
      'gap IDs must be unique gap- identifiers',
    )
    ids.add(gap.id)
    requireThat(
      text(gap.title) &&
        ['task', 'bug', 'feature'].includes(gap.type) &&
        /^P[1-3]$/.test(gap.priority),
      `${gap.id}: title, type and P1-P3 priority required`,
    )
    requireThat(
      strings(gap.acceptanceCriteria) && strings(gap.evidence),
      `${gap.id}: acceptance criteria and evidence required`,
    )
    requireThat(
      strings(gap.criteria) && gap.criteria.every((id) => /^[a-g]$/.test(id)),
      `${gap.id}: known criterion links required`,
    )
  }
  for (const row of criteria.filter(({ status }) => status !== 'pass')) {
    requireThat(
      document.gaps.some((gap) => gap.criteria.includes(row.id)),
      `incomplete criterion ${row.id} has no proposed gap`,
    )
  }
  return document.gaps.length
    ? `${document.gaps.length} proposed gaps; every incomplete criterion links to at least one proposal.`
    : 'None: no post-v1 gaps declared; all preceding criteria pass.'
}

export function checkV1Completion({ root = defaultRoot } = {}) {
  root = path.resolve(root)
  const criteria = []
  const result = {
    schemaVersion: 1,
    v1Complete: false,
    criteria,
    gaps: [],
    reviewOutputs: {},
    dogfood: {},
  }
  const add = (id, criterion, evidence, check) => {
    const row = { id, criterion, status: 'pass', evidence, detail: '', gaps: [] }
    try {
      row.detail = check(row)
    } catch (error) {
      row.status = 'fail'
      row.detail = error.message
    }
    row.detail = row.detail.split(root).join('<root>')
    criteria.push(row)
  }
  add(
    'a',
    'Every registered skill has a canonical SKILL.md and a resolving relative Codex link.',
    [catalogPath, '.claude/skills/', '.agents/skills/'],
    () => checkLinks(root, json(root, catalogPath)),
  )
  add(
    'b',
    'The catalog and routing/review map validate through the existing platform contract.',
    [
      'node scripts/agent-skills/validate-platform.mjs',
      'scripts/agent-skills/lib.mjs',
      'scripts/agent-skills/routing.mjs',
      catalogPath,
      mapPath,
    ],
    (row) => {
      const platform = validatePlatform({ root })
      if (!platform.passed) {
        // Unregistered entries cannot be excused when Git cannot answer.
        // Preserve every diagnostic and keep the overall verdict incomplete.
        const missingProbe = platform.errors.some((message) =>
          message.startsWith('skill roots cannot be checked'),
        )
        const independentErrors = platform.errors.filter(
          (message) =>
            !message.startsWith('skill roots cannot be checked') &&
            !message.startsWith('unregistered '),
        )
        if (missingProbe && independentErrors.length === 0) {
          row.status = 'not-mechanically-checkable'
          return `Git ignore evidence unavailable in this execution; host reproduction required. ${platform.errors.join('; ')}`
        }
        explain(platform.errors)
        throw new Error('platform validation did not pass')
      }
      return `${platform.summary.skills} skills, ${platform.summary.routes} routes and ${platform.summary.upstreamEntries} upstream lock entries validate.`
    },
  )
  add(
    'c',
    'Recorded structured review outputs are accepted by the review-result ingestion contract.',
    [
      'tests/agent-skills/fixtures/',
      'node scripts/agent-skills/validate-review-result.mjs <result.json>',
      'node scripts/agent-skills/ingest-result.mjs reports/agent-skills/<result>.json --dry-run',
      'scripts/agent-skills/lib.mjs',
      forward('blind-review.json'),
      forward('results.json'),
    ],
    () => {
      const { outputs, containers } = reviewSources(root)
      requireThat(outputs.length > 0, 'no structured review outputs found')
      const catalog = json(root, catalogPath)
      const known = new Set(catalog.skills.map(({ id }) => id))
      const errors = []
      for (const { source, result: output } of outputs) {
        try {
          explain(validateReviewResult(output))
          requireThat(known.has(output.skill), `unregistered review skill: ${output.skill}`)
          buildAegisIngestCommand({
            root,
            resultPath: `reports/agent-skills/${output.reviewId}.json`,
            result: output,
          })
        } catch (error) {
          errors.push(`${source}: ${error.message}`)
        }
      }
      // Forward containers are evaluation records, not review-result envelopes.
      // Validate their embedded advice with the original scorer, never invent
      // missing review IDs, generation timestamps or ingestion receipts.
      scoreEvaluation({
        inputs: json(root, forward('inputs.json')),
        labels: json(root, forward('labels.json')),
        blind: json(root, forward('blind-review.json')),
        skillIds: [...known],
      })
      explain(errors)
      const covered = new Set(outputs.map(({ result: output }) => output.skill))
      result.reviewOutputs = {
        accepted: outputs.length,
        sources: outputs.map(({ source }) => source),
        evaluationContainers: containers,
        skillsWithoutRecordedEnvelope: [...known].filter((id) => !covered.has(id)).sort(),
      }
      return `${outputs.length} recorded per-skill envelopes pass validation and in-memory ingestion command construction. ${containers.length} forward containers are evaluation/provenance records, not ingestible per-skill envelopes; embedded blind advice passes the evaluation contract. No ingestion was executed. Skills without a persisted envelope: ${result.reviewOutputs.skillsWithoutRecordedEnvelope.join(', ') || 'none'}.`
    },
  )
  add(
    'd',
    'Five distinct real-PR dogfood records reproduce through evaluate-forward.mjs.',
    [
      forward('inputs.json'),
      forward('labels.json'),
      forward('freeze.json'),
      forward('blind-review.json'),
      forward('results.json'),
      'node scripts/agent-skills/evaluate-forward.mjs --check',
    ],
    () => {
      const inputs = json(root, forward('inputs.json'))
      requireThat(
        text(inputs.source) && /^[a-f0-9]{64}$/.test(inputs.sourceSha256),
        'PR records need a named offline source and SHA-256 digest',
      )
      requireThat(
        inputs.cases?.length === 5 && new Set(inputs.cases.map(({ number }) => number)).size === 5,
        'dogfood requires five distinct PR numbers',
      )
      requireThat(
        new Set(inputs.cases.map(({ merge }) => merge)).size === 5,
        'dogfood requires distinct merge identities',
      )
      for (const pr of inputs.cases) {
        requireThat(
          text(pr.title) && text(pr.branch) && strings(pr.files),
          `PR ${pr.number}: title, branch and changed files required`,
        )
        requireThat(
          typeof pr.mergedAt === 'string' && !Number.isNaN(Date.parse(pr.mergedAt)),
          `PR ${pr.number}: mergedAt required for real-PR provenance`,
        )
      }
      const freeze = json(root, forward('freeze.json'))
      for (const name of frozenPaths)
        requireThat(/^[a-f0-9]{64}$/.test(freeze.sha256?.[name]), `missing frozen digest: ${name}`)
      // The evaluator resolves the original freeze keys to baseline-v1 snapshots.
      // Criteria b/f still validate the live routing configuration independently.
      const replay = evaluateForward({ root: pathToFileURL(`${root}${path.sep}`) })
      requireThat(
        isDeepStrictEqual(replay, json(root, forward('results.json'))),
        'forward-results.json differs from deterministic replay',
      )
      result.dogfood = {
        cases: replay.metrics.cases,
        numbers: inputs.cases.map(({ number }) => number),
        metrics: replay.metrics,
        qualityMisses: replay.cases
          .filter((row) => row.falseNegatives.includes('quality-reliability-observability'))
          .map(({ number }) => number),
        unusableAdvice: replay.cases.flatMap((row) =>
          row.advice
            .filter((item) => !item.usable)
            .map((item) => ({ number: row.number, skill: item.skill })),
        ),
        usefulExtras: replay.cases.reduce(
          (count, row) =>
            count +
            row.advice.filter((item) => item.usable && row.falsePositives.includes(item.skill))
              .length,
          0,
        ),
      }
      return `Five frozen coordinator-supplied merged PRs (${result.dogfood.numbers.map((number) => `#${number}`).join(', ')}) reproduce predictions, advice coverage, metrics and provenance. Real-PR identity relies on the recorded offline source; no network attestation or new human review is claimed.`
    },
  )
  add(
    'e',
    'Published routing and review measurements match the machine-readable forward results.',
    [forward('report.md'), forward('results.json'), 'scripts/agent-skills/evaluation.mjs'],
    () => {
      requireThat(
        read(root, forward('report.md')) === renderReport(json(root, forward('results.json'))),
        'forward-report.md differs from renderReport(forward-results.json)',
      )
      return 'The complete published Markdown report equals the shared renderer output, including all routing counts, rates, misses and advice findings. Criterion d separately checks the underlying measurements against replay.'
    },
  )
  add(
    'f',
    'Blocking eligibility is restricted to deterministic allowlists; subjective findings remain advisory.',
    [
      catalogPath,
      mapPath,
      'scripts/agent-skills/routing.mjs',
      'scripts/agent-skills/lib.mjs',
      'tests/agent-skills/fixtures/',
      forward('blind-review.json'),
      forward('results.json'),
    ],
    () => {
      const catalog = json(root, catalogPath),
        reviewMap = json(root, mapPath)
      explain(validateRoutingConfig({ catalog, reviewMap }))
      requireThat(
        catalog.policy.deterministicFindings === 'blocking-eligible',
        'deterministic findings policy must remain blocking-eligible',
      )
      const checks = catalog.policy.deterministicChecks
      requireThat(
        strings(checks) && checks.every((name) => deterministicCheckIds.includes(name)),
        'catalog checks must be in the independently pinned deterministic v1 allowlist',
      )
      for (const route of reviewMap.routes) {
        requireThat(
          Array.isArray(route.requiredChecks) &&
            route.requiredChecks.every((name) => checks.includes(name)),
          `${route.id}: required checks must be in the catalog deterministic allowlist`,
        )
      }
      const sources = reviewSources(root)
      for (const { source, result: output } of [
        ...sources.outputs,
        ...sources.deterministicExamples,
      ]) {
        explain(validateReviewResult(output).map((error) => `${source}: ${error}`))
      }
      const blind = json(root, forward('blind-review.json'))
      scoreEvaluation({
        inputs: json(root, forward('inputs.json')),
        labels: json(root, forward('labels.json')),
        blind,
        skillIds: catalog.skills.map(({ id }) => id),
      })
      const published = json(root, forward('results.json'))
      requireThat(
        published.mode === 'advisory' && published.blocking === false,
        'published evaluation must remain advisory and non-blocking',
      )
      for (const row of published.cases)
        for (const advice of row.advice)
          for (const finding of advice.findings) {
            requireThat(
              finding.subjective === true && finding.blocking === false,
              'published advice findings must remain subjective and non-blocking',
            )
          }
      return 'Catalog check IDs, routing check classes, route policy and recorded subjective findings respect the deterministic/advisory boundary. Deterministic fixture examples may block; their synthetic evidence does not claim those checks ran. Human truthfulness and live enforcement are outside this static check.'
    },
  )
  add(
    'g',
    'Post-v1 gaps are explicit and every incomplete criterion links to a proposed gap.',
    [gapPath, reportPath],
    () => {
      const document = json(root, gapPath)
      const detail = validateGaps(document, criteria)
      result.gaps = document.gaps
      return detail
    },
  )
  for (const row of criteria)
    row.gaps = result.gaps.filter((gap) => gap.criteria.includes(row.id)).map(({ id }) => id)
  result.v1Complete = criteria.every(({ status }) => status === 'pass')
  return result
}

const cell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')

function measurementSummary({ dogfood }) {
  if (!dogfood.metrics)
    return 'The five-PR replay is incomplete in this run. Consult criterion d for the missing evidence. Gap proposals reference the preserved baseline in forward-report.md; this run does not certify those measurements.'
  const m = dogfood.metrics
  const pct = (value) => (value === null ? 'not assessed' : `${(value * 100).toFixed(1)}%`)
  return `The frozen ${m.cases}-PR report records ${m.truePositives} true positives, ${m.falsePositives} false positives, ${m.falseNegatives} false negatives and ${m.trueNegatives} true negatives: precision ${pct(m.precision)}, recall ${pct(m.recall)}, exact matches ${m.exactMatches}/${m.cases}. The quality-reliability-observability misses are ${dogfood.qualityMisses.map((number) => `#${number}`).join(', ') || 'none'}. Broad-path overlaps and task-text noise are documented revision candidates. Unusable advice: ${m.unusableAdvice}/${m.assessedAdvice} assessments, with ${m.unusableAdviceFindings} findings (${dogfood.unusableAdvice.map(({ number, skill }) => `${skill} on #${number}`).join('; ') || 'none'}). ${dogfood.usefulExtras} of ${m.falsePositives} extra selections still produced usable adjacent-scope advice under the blind reviewer’s judgment. These are revision inputs, not subjective blocking gates. See [the measured report](forward-report.md).`
}

export function renderCompletionReport(result) {
  return [
    '# Skill suite v1 completion and post-v1 gaps',
    '',
    `**v1 complete: ${result.v1Complete ? 'yes' : 'no'}**`,
    '',
    'This verdict covers the seven accepted criteria for the registered project skill suite. A missing or uncheckable criterion prevents completion. It is not approval to promote subjective findings, merge, publish externally, or execute a workflow.',
    '',
    'Generated offline by `node scripts/agent-skills/check-v1-completion.mjs` from the current files and [gap proposals](v1-gaps.json). [Machine-readable verdict](v1-completion.json). No clock, model call or network lookup is used. Managed Gas City skills are governed by the existing Git-ignore-aware platform validator.',
    '',
    '| ID | Criterion | Status | Evidence and detail | Proposed gaps |',
    '| --- | --- | --- | --- | --- |',
    ...result.criteria.map(
      (row) =>
        `| ${row.id} | ${cell(row.criterion)} | ${row.status} | ${cell(row.detail)} Evidence: ${row.evidence.map((item) => `\`${cell(item)}\``).join(', ')} | ${row.gaps.map((id) => `[${id}](#${id})`).join(', ') || 'none'} |`,
    ),
    '',
    '## Measurement and capability limits',
    '',
    measurementSummary(result),
    '',
    'Criterion c checks the existing validator and ingestion command builder, without invoking the legacy Aegis sink. Forward metadata, routing and advice containers use the evaluation contract; they are not silently converted into per-skill review-result envelopes. Synthetic fixtures prove contract acceptance only. Recorded PR provenance and blind review are preserved evidence, not independently reattested by this offline run. Capability coverage, validator/schema parity and the current ingestion destination remain explicit proposals below.',
    '',
    '## Post-v1 gaps',
    '',
    ...(result.gaps.length
      ? [
          `${result.gaps.length} proposals for coordinator review and later Beads creation. No Beads or Taskmaster tasks were created by this check.`,
          '',
          ...result.gaps.flatMap((gap) => [
            `<a id="${gap.id}"></a>`,
            `### ${gap.title}`,
            '',
            `ID: ${gap.id}. Type: ${gap.type}. Priority: ${gap.priority}. Criteria: ${gap.criteria.join(', ')}.`,
            '',
            ...(gap.detail ? [gap.detail, ''] : []),
            'Acceptance criteria:',
            '',
            ...gap.acceptanceCriteria.map((item) => `- ${item}`),
            '',
            `Evidence: ${gap.evidence.map((item) => `\`${item}\``).join(', ')}.`,
            '',
          ]),
        ]
      : [
          result.criteria.find(({ id }) => id === 'g').status === 'pass'
            ? 'None explicitly declared.'
            : 'Gap declaration is invalid or missing; criterion g is incomplete.',
          '',
        ]),
    '## Reproduction',
    '',
    '- Use Node 24.18.0. `node scripts/agent-skills/check-v1-completion.mjs` writes both completion artifacts, including an incomplete verdict when evidence is missing.',
    '- `node scripts/agent-skills/check-v1-completion.mjs --check` compares both artifacts without writing. Exit 0 requires both a complete verdict and current artifacts; exit 1 means incomplete or stale evidence; exit 2 means invalid arguments.',
    '- `node --test tests/agent-skills/v1-completion.test.mjs` exercises positive and negative mechanical fixtures. `node scripts/agent-skills/evaluate-forward.mjs --check` reproduces the frozen evaluation.',
    '- Run `node scripts/agent-skills/validate-platform.mjs` on the host if criterion b cannot obtain Git ignore evidence. A subprocess timeout or permission refusal is missing verification, never a successful platform check.',
    '',
    'The checker is not added to package scripts or CI in this change. Its gap manifest is reviewed input; mechanical coverage cannot prove that every future qualitative gap has been discovered.',
    '',
  ].join('\n')
}

export function runCompletion({ root = defaultRoot, check = false } = {}) {
  const result = checkV1Completion({ root })
  const artifacts = {
    [jsonPath]: `${JSON.stringify(result, null, 2)}\n`,
    [reportPath]: renderCompletionReport(result),
  }
  for (const [name, content] of Object.entries(artifacts)) {
    if (check) requireThat(read(root, name) === content, `stale completion artifact: ${name}`)
    else fs.writeFileSync(path.join(root, name), content)
  }
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  if (!(args.length === 0 || (args.length === 1 && args[0] === '--check'))) {
    console.error('usage: check-v1-completion.mjs [--check]')
    process.exitCode = 2
  } else {
    try {
      const result = runCompletion({ check: args.includes('--check') })
      console.log(
        JSON.stringify(
          {
            v1Complete: result.v1Complete,
            criteria: result.criteria.map(({ id, status }) => ({ id, status })),
            gaps: result.gaps.length,
          },
          null,
          2,
        ),
      )
      if (!result.v1Complete) process.exitCode = 1
    } catch (error) {
      console.error(error.message)
      process.exitCode = 1
    }
  }
}
