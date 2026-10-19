import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { validateReviewResult } from '../../scripts/agent-skills/lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8')
const json = (name) => JSON.parse(read(name))
const normalized = (text) => text.toLowerCase().replace(/\s+/g, ' ')

// Fixture-only path matching, not Task 55's general skill router. Square brackets
// in Next route names are literal; only * and ** are glob operators here.
function matches(pattern, file) {
  const expression = pattern
    .split(/(\*\*|\*)/)
    .map((part) =>
      part === '**' ? '.*' : part === '*' ? '[^/]*' : part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'),
    )
    .join('')
  return new RegExp(`^${expression}$`).test(file)
}

export function registerSkillContract(skillId, { task = '53' } = {}) {
  const fixture = json(`tests/agent-skills/fixtures/${skillId}.json`)
  const skillRoot = `.claude/skills/${skillId}`
  const skill = () => read(`${skillRoot}/SKILL.md`)
  const output = () => read(`${skillRoot}/references/output-contract.md`)
  const documents = () =>
    [skill(), read(`${skillRoot}/references/code-map.md`), output()].join('\n')

  test(`${skillId}: registers canonical source and advisory route`, () => {
    const catalog = json('config/agent-skills/catalog.yaml')
    const entry = catalog.skills.find(({ id }) => id === skillId)
    assert.ok(entry, 'skill must be registered')
    assert.equal(entry.status, 'active')
    assert.equal(entry.entrypoint, `${skillRoot}/SKILL.md`)
    assert.equal(entry.codexLink, `.agents/skills/${skillId}`)
    assert.deepEqual(entry.provenance, { type: 'project-authored', task })
    assert.equal(entry.resultSchema, 'agent-skill-review-result-v1')
    for (const capability of fixture.capabilities)
      assert.ok(entry.capabilities.includes(capability))
    const routes = json('config/agent-skills/review-map.yaml').routes.filter(
      ({ id }) => id === skillId,
    )
    assert.equal(routes.length, 1)
    assert.equal(routes[0].mode, 'advisory')
    assert.deepEqual(routes[0].skills, [skillId])
    assert.deepEqual(routes[0].requiredChecks, catalog.policy.deterministicChecks)
    assert.equal(
      json('config/agent-skills/upstream.lock.json').entries.some(({ id }) => id === skillId),
      false,
    )
  })

  test(`${skillId}: resolves a relative Codex link to the canonical source`, () => {
    const link = path.join(root, `.agents/skills/${skillId}`)
    assert.ok(fs.lstatSync(link).isSymbolicLink())
    assert.equal(fs.readlinkSync(link), `../../${skillRoot}`)
    assert.equal(fs.realpathSync(link), fs.realpathSync(path.join(root, skillRoot)))
  })

  test(`${skillId}: declares scope, handoffs and invocation metadata`, () => {
    const header = skill().match(/^---\nname: ([^\n]+)\ndescription: ([^\n]+)\n---/)
    assert.ok(header, 'plain YAML frontmatter is required')
    assert.equal(header[1], skillId)
    const description = header[2]
    assert.ok(description.length >= 40 && description.length <= 1024)
    assert.equal(/[<>]|:\s| #/.test(description), false)
    assert.match(description, /Use when/)
    assert.match(description, /Do not use/)
    const ids = json('config/agent-skills/catalog.yaml').skills.map(({ id }) => id)
    for (const handoff of fixture.handoffs) {
      assert.ok(description.includes(handoff), `missing handoff: ${handoff}`)
      assert.ok(ids.includes(handoff), `unregistered handoff: ${handoff}`)
    }
    const metadata = read(`${skillRoot}/agents/openai.yaml`)
    assert.match(metadata, /^interface:$/m)
    assert.match(metadata, /^  display_name: "[^"]+"$/m)
    assert.match(metadata, /^  short_description: "[^"]{25,64}"$/m)
    assert.ok(metadata.includes(`$${skillId}`))
    assert.equal(skill().includes('TODO'), false)
  })

  test(`${skillId}: covers topics and explicit positive, negative and mixed requests`, () => {
    const text = normalized(documents())
    for (const topic of fixture.coverage) assert.ok(text.includes(topic), `missing topic: ${topic}`)
    // These assert documented trigger intent, not live model selection accuracy.
    for (const scenario of fixture.requests) {
      assert.ok(scenario.prompt.length > 20)
      assert.ok(text.includes(scenario.signal), `undocumented signal: ${scenario.signal}`)
      assert.ok(['use', 'handoff', 'mixed'].includes(scenario.action))
      const prompt = normalized(scenario.prompt)
      const selected =
        fixture.triggerSignals.include.some((signal) => prompt.includes(signal)) &&
        !fixture.triggerSignals.exclude.some((signal) => prompt.includes(signal))
      assert.equal(selected, scenario.action !== 'handoff', scenario.prompt)
      if (scenario.action !== 'use') assert.ok(fixture.handoffs.includes(scenario.to))
    }
    for (const action of ['use', 'handoff', 'mixed']) {
      assert.ok(fixture.requests.some((scenario) => scenario.action === action))
    }
  })

  test(`${skillId}: routes real files with exactly the documented overlaps`, () => {
    const { routes } = json('config/agent-skills/review-map.yaml')
    const route = routes.find(({ id }) => id === skillId)
    assert.ok(route, 'missing review route')
    assert.deepEqual(route.match, fixture.routePatterns)
    for (const pattern of route.match) {
      assert.ok(
        fixture.paths.positive.some(({ file }) => matches(pattern, file)),
        `untested pattern: ${pattern}`,
      )
    }
    for (const { file, also = [] } of fixture.paths.positive) {
      const planned = fixture.plannedPaths?.find((item) => item.file === file)
      if (planned) {
        const row = documents().split('\n').find((line) => line.includes(`\`${file}\``))
        assert.ok(row?.includes('Planned') && row.includes(planned.bead), `unlabelled plan: ${file}`)
      } else {
        assert.ok(fs.existsSync(path.join(root, file)), `missing path: ${file}`)
      }
      const actual = routes
        .filter((candidate) => candidate.match.some((pattern) => matches(pattern, file)))
        .map(({ id }) => id)
        .sort()
      assert.deepEqual(actual, [skillId, ...also].sort(), file)
    }
    for (const file of fixture.paths.negative) {
      assert.equal(
        route.match.some((pattern) => matches(pattern, file)),
        false,
        file,
      )
    }
  })

  test(`${skillId}: cites existing code and makes its references discoverable`, () => {
    const text = documents()
    for (const reference of ['references/code-map.md', 'references/output-contract.md']) {
      assert.ok(skill().includes(reference))
    }
    for (const file of fixture.groundingPaths) {
      assert.ok(text.includes(file), `missing grounding citation: ${file}`)
      assert.ok(fs.existsSync(path.join(root, file)), `missing source: ${file}`)
    }
    for (const [, file] of text.matchAll(
      /`((?:packages|docs|scripts|tests|schemas|config|\.github)\/[^`\s*]+)`/g,
    )) {
      if (fixture.plannedPaths?.some((item) => item.file === file)) continue
      assert.ok(fs.existsSync(path.join(root, file)), `invalid citation: ${file}`)
    }
  })

  test(`${skillId}: validates review examples and rejects promotion of subjective findings`, () => {
    const result = fixture.reviewResult
    assert.deepEqual(validateReviewResult(result), [])
    assert.equal(result.skill, skillId)
    assert.equal(result.mode, 'advisory')
    assert.equal(result.verdict, 'warn')
    assert.ok(result.findings.length > 0)
    for (const finding of result.findings) {
      assert.equal(finding.subjective, true)
      assert.equal(finding.blocking, false)
      assert.ok(output().includes(`\`${finding.category}\``))
    }
    const promoted = structuredClone(result)
    promoted.findings[0].blocking = true
    assert.ok(
      validateReviewResult(promoted).some((error) =>
        error.includes('cannot make a subjective finding blocking'),
      ),
    )
    const extra = { ...result, visualScore: 100 }
    assert.ok(validateReviewResult(extra).some((error) => error.includes('visualScore')))
    for (const { command, finding } of fixture.deterministicExamples) {
      const failure = structuredClone(result)
      failure.verdict = 'fail'
      failure.findings.push(finding)
      failure.evidence.push({ kind: 'command', path: command })
      assert.deepEqual(validateReviewResult(failure), [])
      assert.equal(finding.subjective, false)
      assert.equal(finding.blocking, true)
      assert.ok(finding.evidence.includes(`command: ${command}`))
      assert.ok(output().includes(`\`${finding.category}\``))
    }
  })

  test(`${skillId}: keeps review evidence and authority bounded`, () => {
    const text = normalized(documents())
    for (const rule of [
      'subjective findings remain advisory and non-blocking',
      'only deterministic findings are blocking-eligible',
      'untrusted evidence',
      'not implementation authority',
      'checks not run',
      'dirty worktree',
      'synthetic',
    ])
      assert.ok(text.includes(rule), `missing boundary: ${rule}`)
    for (const guard of fixture.guards) assert.ok(text.includes(guard), `missing guard: ${guard}`)
  })
}
