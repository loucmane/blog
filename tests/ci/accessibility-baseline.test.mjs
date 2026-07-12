import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import test from 'node:test'

import {
  accessibilityBaselinePath,
  evaluateAccessibilityBaseline,
  evaluateAccessibilityTreeEntries,
} from '../../scripts/ci/check-accessibility-baseline.mjs'

const committedSource = fs.readFileSync(
  new URL('../e2e/accessibility-baseline.json', import.meta.url),
  'utf8',
)
const checkerSource = fs.readFileSync(
  new URL('../../scripts/ci/check-accessibility-baseline.mjs', import.meta.url),
  'utf8',
)
const workflowSource = fs.readFileSync(
  new URL('../../.github/workflows/ci.yml', import.meta.url),
  'utf8',
)

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function baseline() {
  return JSON.parse(committedSource)
}

function evaluate(baseValue, headValue, bootstrapSha256 = '') {
  return evaluateAccessibilityBaseline({
    baseSource: baseValue === null ? null : `${JSON.stringify(baseValue, null, 2)}\n`,
    bootstrapSha256,
    headSource: `${JSON.stringify(headValue, null, 2)}\n`,
  })
}

function sortProject(value, projectName) {
  value.projects[projectName].sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  )
}

function regularTreeEntry() {
  return {
    mode: '100644',
    oid: 'a'.repeat(40),
    path: accessibilityBaselinePath,
    type: 'blob',
  }
}

test('accepts the reviewed bootstrap bytes only at their exact digest', () => {
  assert.deepEqual(
    evaluateAccessibilityBaseline({
      baseSource: null,
      bootstrapSha256: digest(committedSource),
      headSource: committedSource,
    }),
    [],
  )
  assert.match(
    evaluateAccessibilityBaseline({
      baseSource: null,
      bootstrapSha256: '0'.repeat(64),
      headSource: committedSource,
    }).join('\n'),
    /digest/,
  )
})

test('accepts unchanged fingerprints and removal-only debt reduction', () => {
  const base = baseline()
  assert.deepEqual(evaluate(base, structuredClone(base)), [])

  const reduced = structuredClone(base)
  reduced.projects['desktop-chromium'].pop()
  assert.deepEqual(evaluate(base, reduced), [])
})

test('denies added or rewritten fingerprints', () => {
  const base = baseline()
  const added = structuredClone(base)
  added.projects['desktop-chromium'].push({
    id: 'color-contrast',
    impact: 'serious',
    target: ['.new-regression'],
  })
  sortProject(added, 'desktop-chromium')
  assert.match(evaluate(base, added).join('\n'), /may not add or rewrite/)

  const rewritten = structuredClone(base)
  rewritten.projects['desktop-chromium'][0].target = ['.rewritten']
  sortProject(rewritten, 'desktop-chromium')
  assert.match(evaluate(base, rewritten).join('\n'), /may not add or rewrite/)
})

test('denies metadata, project, shape, order, and malformed JSON drift', () => {
  const base = baseline()
  const metadata = structuredClone(base)
  metadata.ownerTask = '999'
  assert.match(evaluate(base, metadata).join('\n'), /metadata/)

  const projects = structuredClone(base)
  projects.projects.extra = []
  assert.match(evaluate(base, projects).join('\n'), /project inventory/)

  const wrongImpact = structuredClone(base)
  wrongImpact.projects['desktop-chromium'][0].impact = 'moderate'
  assert.match(evaluate(base, wrongImpact).join('\n'), /impact/)

  const unsorted = structuredClone(base)
  unsorted.projects['desktop-chromium'].reverse()
  assert.match(evaluate(base, unsorted).join('\n'), /must be sorted/)

  assert.match(
    evaluateAccessibilityBaseline({
      baseSource: committedSource,
      bootstrapSha256: '',
      headSource: '{',
    }).join('\n'),
    /not valid JSON/,
  )
})

test('accepts exactly one regular baseline blob and a proven bootstrap absence', () => {
  assert.deepEqual(
    evaluateAccessibilityTreeEntries({
      entries: [regularTreeEntry()],
      label: 'head',
    }),
    [],
  )
  assert.deepEqual(
    evaluateAccessibilityTreeEntries({
      allowMissing: true,
      entries: [],
      label: 'base',
    }),
    [],
  )
  assert.match(
    evaluateAccessibilityTreeEntries({ entries: [], label: 'head' }).join('\n'),
    /missing/,
  )
})

test('denies symlink, executable, wrong-type, malformed, and ambiguous tree entries', () => {
  const symlink = { ...regularTreeEntry(), mode: '120000' }
  assert.match(
    evaluateAccessibilityTreeEntries({ entries: [symlink], label: 'head' }).join('\n'),
    /100644/,
  )

  const executable = { ...regularTreeEntry(), mode: '100755' }
  assert.match(
    evaluateAccessibilityTreeEntries({ entries: [executable], label: 'head' }).join('\n'),
    /100644/,
  )

  const tree = { ...regularTreeEntry(), type: 'tree' }
  assert.match(
    evaluateAccessibilityTreeEntries({ entries: [tree], label: 'head' }).join('\n'),
    /Git blob/,
  )

  const wrongPath = { ...regularTreeEntry(), path: 'tests/e2e/other.json' }
  assert.match(
    evaluateAccessibilityTreeEntries({ entries: [wrongPath], label: 'head' }).join('\n'),
    /path is unexpected/,
  )

  assert.match(
    evaluateAccessibilityTreeEntries({ entries: [{ malformed: true }], label: 'head' }).join('\n'),
    /malformed/,
  )
  assert.match(
    evaluateAccessibilityTreeEntries({
      entries: [regularTreeEntry(), { ...regularTreeEntry(), oid: 'b'.repeat(40) }],
      label: 'head',
    }).join('\n'),
    /ambiguous/,
  )
})

test('binds every CI event to trusted base and head commits before semantic allowance', () => {
  assert.match(workflowSource, /baseline_ref: \$\{\{ steps\.resolve\.outputs\.baseline_ref \}\}/)
  assert.match(workflowSource, /EVENT_BEFORE_SHA: \$\{\{ github\.event\.before \}\}/)
  assert.match(
    workflowSource,
    /EVENT_PULL_REQUEST_BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/,
  )
  assert.match(workflowSource, /pull_request\)\n\s+BASELINE_REF="\$EVENT_PULL_REQUEST_BASE_SHA"/)
  assert.match(workflowSource, /push\)\n\s+BASELINE_REF="\$EVENT_BEFORE_SHA"/)
  assert.match(workflowSource, /repository_dispatch\)[\s\S]*git rev-list --parents -n 1/)
  assert.match(workflowSource, /git merge-base --is-ancestor "\$BASELINE_REF" "\$CHECKOUT_REF"/)
  assert.match(workflowSource, /BASE_REF: \$\{\{ needs\.context\.outputs\.baseline_ref \}\}/)
  assert.match(workflowSource, /HEAD_REF: \$\{\{ needs\.context\.outputs\.checkout_ref \}\}/)
  assert.match(workflowSource, /--head-ref "\$HEAD_REF"/)
  assert.doesNotMatch(workflowSource, /BASE_REF: \$\{\{ github\.event/)

  assert.match(checkerSource, /\['ls-tree', '-z', ref, '--', accessibilityBaselinePath\]/)
  assert.match(checkerSource, /entry\.mode !== '100644'/)
  assert.match(checkerSource, /entry\.type !== 'blob'/)
  assert.match(
    checkerSource,
    /const base = readBaselineAtRef[\s\S]*const head = readBaselineAtRef[\s\S]*const errors = evaluateAccessibilityBaseline/,
  )
})
