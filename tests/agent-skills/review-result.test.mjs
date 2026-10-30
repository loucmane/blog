import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { buildBeadsIngestPlan, validateReviewResult } from '../../scripts/agent-skills/lib.mjs'
import { blockingEligibleCategories } from '../../scripts/agent-skills/routing.mjs'
import { compileSchema } from './json-schema-subset.mjs'

const repository = fileURLToPath(new URL('../../', import.meta.url))
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(repository, file), 'utf8'))
const schema = readJson('schemas/agent-skills/review-result.schema.json')
// Governance runs without node_modules. This independent test oracle supports
// only the published schema's vocabulary and rejects unknown assertions.
const schemaValidator = compileSchema(schema)

function assertDecisions(result, expected, context) {
  const runtimeErrors = validateReviewResult(result)
  const schemaErrors = schemaValidator(result)
  assert.deepEqual(
    { runtime: runtimeErrors.length === 0, schema: schemaErrors.length === 0 },
    { runtime: expected, schema: expected },
    `${context}\nruntime: ${JSON.stringify(runtimeErrors)}\nschema: ${JSON.stringify(schemaErrors)}`,
  )
}

function assertSchemaCases(definition, accepted, rejected) {
  const validate = compileSchema(definition)
  for (const value of accepted) assert.deepEqual(validate(value), [], JSON.stringify(value))
  for (const value of rejected) assert.ok(validate(value).length > 0, JSON.stringify(value))
}

test('schema subset asserts JSON types without coercion', () => {
  for (const [type, accepted, rejected] of [
    ['object', [{}, { a: 1 }], [null, [], 'object']],
    ['array', [[], [1]], [{}, null, 'array']],
    ['string', ['', 'text'], [null, 1, true]],
    ['boolean', [true, false], [0, 'true', null]],
    ['null', [null], [{}, 'null', false]],
    ['number', [0, -1, 1.5], ['1', null, Infinity, NaN]],
    ['integer', [0, -1, 2], [1.5, '2', Infinity]],
  ])
    assertSchemaCases({ type }, accepted, rejected)
})

test('schema subset asserts required, properties and additionalProperties independently', () => {
  assertSchemaCases({ required: ['x'] }, [{ x: null }, [], null], [{}, { y: 1 }])
  assertSchemaCases(
    { properties: { x: { type: 'string' } } },
    [{}, { x: 'ok', y: 1 }, null],
    [{ x: 1 }],
  )
  assertSchemaCases(
    { properties: { x: {} }, additionalProperties: false },
    [{}, { x: 1 }, []],
    [{ y: 1 }, { x: 1, y: 2 }],
  )
  assertSchemaCases({ additionalProperties: false }, [{}, null], [{ x: 1 }])
  // Inherited JS properties cannot satisfy JSON object requirements.
  assertSchemaCases({ required: ['toString'] }, [{ toString: 'own' }], [{}])
})

test('schema subset compares enum and const as JSON values', () => {
  assertSchemaCases(
    { enum: [1, false, null, { a: 1, b: [2] }] },
    [1, false, null, { b: [2], a: 1 }],
    ['1', true, { a: 1, b: [3] }],
  )
  assertSchemaCases(
    { const: { a: [1, 2], b: false } },
    [{ b: false, a: [1, 2] }],
    [{ a: [2, 1], b: false }, { a: [1, 2] }],
  )
  assertSchemaCases({ const: 0 }, [0, -0], [false, '0'])
})

test('schema subset counts Unicode code points and uses Unicode patterns', () => {
  assertSchemaCases({ minLength: 2 }, ['ab', '😀a', 1], ['', 'a', '😀'])
  assertSchemaCases({ pattern: '^.$' }, ['😀', 'a', 1], ['', 'ab'])
  assertSchemaCases({ pattern: '\\p{Letter}+' }, ['123é123', '字'], ['123', '😀'])
})

test('schema subset asserts date-time syntax and the Gregorian calendar independently', () => {
  assertSchemaCases(
    { format: 'date-time' },
    [
      '2024-02-29T23:59:59Z',
      '2000-02-29t00:00:00z',
      '0000-02-29T00:00:00Z',
      '0099-01-01T00:00:00Z',
      '2026-01-31T00:00:00.123456+23:59',
      '2026-04-30T00:00:00-23:59',
      '2026-12-31T00:00:00-00:00',
      1,
    ],
    [
      '1900-02-29T00:00:00Z',
      '2100-02-29T00:00:00Z',
      '2025-02-29T00:00:00Z',
      '2026-04-31T00:00:00Z',
      '2026-01-32T00:00:00Z',
      '2026-00-01T00:00:00Z',
      '2026-13-01T00:00:00Z',
      '2026-01-00T00:00:00Z',
      '2026-01-01T24:00:00Z',
      '2026-01-01T00:60:00Z',
      '2026-01-01T00:00:60Z',
      '2026-01-01T00:00:00+24:00',
      '2026-01-01T00:00:00+00:60',
      '2026-01-01T00:00:00+0100',
      '2026-01-01T00:00Z',
      '2026-01-01T00:00:00',
      '2026-01-01 00:00:00Z',
      '2026-1-01T00:00:00Z',
      '2026-01-01T00:00:00.Z',
      '2026-01-01T00:00:00Z\n',
      '2026-01-01T00:00:00Zjunk',
    ],
  )
})

test('schema subset applies items and inclusive array bounds', () => {
  assertSchemaCases({ items: { type: 'string' } }, [[], ['a', 'b'], {}], [['a', 1]])
  assertSchemaCases({ minItems: 1, maxItems: 2 }, [[1], [1, 2], ''], [[], [1, 2, 3]])
  assertSchemaCases({ maxItems: 0 }, [[], null], [[null]])
})

test('schema subset evaluates every allOf assertion and conditional then', () => {
  assertSchemaCases({ allOf: [{ type: 'string' }, { minLength: 2 }] }, ['ok'], [1, 'a'])
  assertSchemaCases(
    {
      if: { required: ['enabled'], properties: { enabled: { const: true } } },
      then: { required: ['value'], properties: { value: { const: 1 } } },
    },
    [{}, { enabled: false }, { enabled: true, value: 1 }],
    [{ enabled: true }, { enabled: true, value: 2 }],
  )
  // Missing properties satisfy a properties-only condition; required is explicit.
  assertSchemaCases(
    { if: { properties: { x: { const: true } } }, then: { required: ['y'] } },
    [{ x: false }, { y: 1 }],
    [{}],
  )
  assertSchemaCases({ if: { const: true } }, [true, false], [])
  assertSchemaCases({ then: { const: true } }, [true, false], [])
})

test('schema subset ignores annotations without resolving remote schemas', () => {
  assertSchemaCases(
    {
      $id: 'https://example.invalid/schema',
      $schema: 'https://example.invalid/meta',
      title: 'Example',
      description: 'Annotation',
      const: 1,
    },
    [1],
    [2],
  )
})

test('schema subset rejects unknown keywords eagerly in every subschema position', () => {
  for (const definition of [
    { minimum: 1 },
    { properties: { unused: { minimum: 1 } } },
    { items: { minimum: 1 } },
    { allOf: [{ minimum: 1 }] },
    { if: { minimum: 1 } },
    { then: { minimum: 1 } },
    { if: { const: false }, then: { minimum: 1 } },
  ])
    assert.throws(() => compileSchema(definition), /unsupported schema keyword minimum/)
})

test('schema subset rejects unsupported keyword forms instead of weakening assertions', () => {
  for (const definition of [
    true,
    null,
    [],
    { type: 'unknown' },
    { type: ['string', 'null'] },
    { additionalProperties: true },
    { additionalProperties: {} },
    { enum: [] },
    { required: 'x' },
    { required: [1] },
    { properties: [] },
    { items: [] },
    { allOf: [] },
    { allOf: {} },
    { minLength: -1 },
    { minItems: 0.5 },
    { maxItems: '2' },
    { pattern: 1 },
    { pattern: '[' },
    { format: 'email' },
  ])
    assert.throws(() => compileSchema(definition))
})

const corpusDirectory = 'tests/agent-skills/review-result-corpus'
const corpusFiles = fs
  .readdirSync(path.join(repository, corpusDirectory))
  .filter((name) => name.endsWith('.json'))
  .sort()
assert.ok(corpusFiles.length > 0, 'the parity corpus must not be empty')
for (const name of corpusFiles) {
  const entry = readJson(`${corpusDirectory}/${name}`)
  test(`shared review corpus: ${name}`, () => {
    assert.equal(typeof entry.valid, 'boolean')
    assert.ok(typeof entry.reason === 'string' && entry.reason.trim())
    assert.ok(Object.hasOwn(entry, 'result'))
    assertDecisions(entry.result, entry.valid, `${name}: ${entry.reason}`)
  })
}

test('schema blocking categories stay aligned with the ingestion allowlist', () => {
  assert.deepEqual(
    schema.properties.findings.items.allOf[1].then.properties.category.enum,
    blockingEligibleCategories,
  )
})

function jsonFiles(directory) {
  return fs
    .readdirSync(path.join(repository, directory), { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? jsonFiles(`${directory}/${entry.name}`)
        : entry.name.endsWith('.json')
          ? [`${directory}/${entry.name}`]
          : [],
    )
    .sort()
}

function envelopes(value, source) {
  if (value === null || typeof value !== 'object') return []
  if (Object.hasOwn(value, 'reviewId') && Object.hasOwn(value, 'skill')) {
    return [{ source, result: value }]
  }
  return Object.entries(value).flatMap(([key, child]) => envelopes(child, `${source}#${key}`))
}

for (const file of [
  ...jsonFiles('tests/agent-skills/fixtures'),
  ...jsonFiles('tests/agent-skills/examples'),
  'docs/agent-skills/forward-blind-review.json',
  'docs/agent-skills/advice-v2-review.json',
]) {
  const document = readJson(file)
  for (const { source, result } of envelopes(document, file)) {
    test(`existing review envelope: ${source}`, () => assertDecisions(result, true, source))
  }
  for (const [index, example] of (document.deterministicExamples ?? []).entries()) {
    const source = `${file}#deterministicExamples/${index}`
    test(`existing deterministic example: ${source}`, () => {
      assertDecisions({ ...document.reviewResult, findings: [example.finding] }, true, source)
    })
  }
}

// The forward blind bundle predates complete result envelopes. Validate each
// advice item's actual findings and evidence in a synthetic test-only wrapper
// with synthetic IDs/severities for legacy findings that lack these fields;
// this does not rewrite the historical artifact or claim it is an envelope.
for (const item of readJson('docs/agent-skills/forward-blind-review.json').cases) {
  for (const advice of item.advice) {
    const source = `forward-blind-review.json#${item.number}/${advice.skill}`
    test(`existing forward advice projection: ${source}`, () => {
      assertDecisions(
        {
          ...validResult(),
          skill: advice.skill,
          headSha: item.merge,
          summary: advice.recommendation,
          findings: advice.findings.map((finding, index) => ({
            id: `legacy-finding-${index}`,
            severity: 'info',
            ...finding,
          })),
          evidence: advice.evidence.map((reference) => ({ kind: 'file', path: reference })),
        },
        true,
        source,
      )
    })
  }
}

function validResult() {
  return {
    schemaVersion: 1,
    reviewId: 'task49-platform-review',
    skill: 'cross-agent-skill-platform',
    mode: 'advisory',
    verdict: 'pass',
    summary: 'Deterministic platform checks passed.',
    generatedAt: '2026-07-10T12:00:00Z',
    headSha: '0123456789abcdef0123456789abcdef01234567',
    findings: [],
    evidence: [{ kind: 'command', path: 'pnpm ci:agent-skills' }],
  }
}

test('accepts a schema-valid advisory review result', () => {
  assert.deepEqual(validateReviewResult(validResult()), [])
})

test('rejects subjective blocking findings', () => {
  const result = validResult()
  result.findings.push({
    id: 'visual-opinion',
    severity: 'warning',
    category: 'design',
    message: 'Typography could feel more editorial.',
    subjective: true,
    blocking: true,
    evidence: ['reviewer observation'],
  })

  assert.ok(
    validateReviewResult(result).some((error) => error.includes('subjective finding blocking')),
  )
})

test('rejects enforcement mode during advisory dogfood', () => {
  const result = validResult()
  result.mode = 'enforced'
  assert.ok(validateReviewResult(result).includes('mode must remain advisory'))
})

test('builds an argument-safe Beads ingestion plan', (t) => {
  const root = fs.mkdtempSync(path.join(repository, 'tests/agent-skills/.review-result-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const resultPath = path.join(root, 'reports/agent-skills/task49.json')
  fs.mkdirSync(path.dirname(resultPath), { recursive: true })
  fs.writeFileSync(resultPath, `${JSON.stringify(validResult(), null, 2)}\n`)

  const plan = buildBeadsIngestPlan({ root, resultPath, bead: 'blog-example' })
  assert.deepEqual(plan.gcArgv.slice(0, 8), [
    '/home/loucmane/gascity/bin/gc',
    '--city',
    '/home/loucmane/gascity/city',
    '--rig',
    'blog',
    'bd',
    'update',
    'blog-example',
  ])
  assert.equal(plan.receipt.evidence, 'reports/agent-skills/task49.json')
  assert.equal(plan.worklog.path, 'docs/worklog/blog-example.md')
})

test('refuses to ingest evidence outside the generated reports root', (t) => {
  const root = fs.mkdtempSync(path.join(repository, 'tests/agent-skills/.review-result-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const resultPath = path.join(root, 'outside.json')
  fs.writeFileSync(resultPath, `${JSON.stringify(validResult(), null, 2)}\n`)

  assert.throws(
    () => buildBeadsIngestPlan({ root, resultPath, bead: 'blog-example' }),
    /must be beneath reports\/agent-skills/,
  )
})
