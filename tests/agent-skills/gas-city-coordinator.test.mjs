import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { evaluateFormulaEntrypoint } from '../../scripts/agent-skills/formula-catalog-guard.mjs'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const read = (relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8')

const normalizedAuthority = () =>
  `${read('AGENTS.md')}\n${read('CLAUDE.md')}`.toLowerCase().replace(/\s+/g, ' ')

test('Claude and Codex resolve one canonical Gas City coordinator skill', () => {
  const canonical = path.join(repositoryRoot, '.claude/skills/gas-city-coordinator/SKILL.md')
  const codexLink = path.join(repositoryRoot, '.agents/skills/gas-city-coordinator')

  assert.equal(fs.statSync(canonical).isFile(), true)
  assert.equal(fs.lstatSync(codexLink).isSymbolicLink(), true)
  assert.equal(fs.readlinkSync(codexLink), '../../.claude/skills/gas-city-coordinator')
  assert.equal(fs.realpathSync(codexLink), path.dirname(canonical))
})

test('active project authority selects Beads and freezes legacy systems', () => {
  const authority = normalizedAuthority()

  assert.match(authority, /beads is the sole active task authority/)
  assert.match(authority, /\.taskmaster\/.*frozen historical/)
  assert.match(authority, /legacy aegis workflow.*frozen historical/)
  assert.match(authority, /must not be updated or repaired/)
  assert.match(authority, /project-local agent owns project intent/)
  assert.match(authority, /gas city is the delegated execution layer/)
  assert.doesNotMatch(authority, /active task authority[^.]*taskmaster|taskmaster is the active/)

  assert.equal(fs.existsSync(path.join(repositoryRoot, '.taskmaster')), true)
  assert.equal(fs.existsSync(path.join(repositoryRoot, '.aegis')), true)
})

test('documents native skills and explicit isolated blog routing', () => {
  const contract = `${normalizedAuthority()} ${read(
    '.claude/skills/gas-city-coordinator/SKILL.md',
  )} ${read('.beads/README.md')}`
    .toLowerCase()
    .replace(/\s+/g, ' ')

  for (const skill of ['gc-city', 'gc-rigs', 'gc-agents', 'gc-work', 'gc-dispatch']) {
    assert.ok(contract.includes(skill), `missing native skill ${skill}`)
  }
  assert.match(contract, /registered rig is `?blog`?/)
  assert.ok(contract.includes('/home/loucmane/gascity/bin/gc'))
  assert.ok(contract.includes('gc_home=/home/loucmane/gascity/home'))
  assert.match(contract, /--rig blog/)
  assert.match(contract, /never trust inherited `?beads_\*`?/)
  assert.match(contract, /never use a cross-rig bare `?bd`? command/)
  assert.match(contract, /every work bead receives a worklog/)
  assert.doesNotMatch(read('.beads/README.md'), /^bd\s/m)
})

test('requires the complete evidence-bounded coordinator lifecycle', () => {
  const skill = read('.claude/skills/gas-city-coordinator/SKILL.md')
    .toLowerCase()
    .replace(/\s+/g, ' ')

  for (const requirement of [
    'reconcile repository, beads, worktrees, and pull request state read-only',
    'select or create a rig-scoped bead',
    'propose the dispatch before its first execution',
    'resume the blog rig',
    'verify real worker processes',
    'managed role or formula',
    'monitor the bead, session, branch, tests, and worklog',
    'route implementation through review',
    'close only with acceptance evidence',
  ]) {
    assert.ok(skill.includes(requirement), `missing lifecycle rule: ${requirement}`)
  }
})

test('does not broaden attended operator boundaries', () => {
  const contract = `${normalizedAuthority()} ${read('.claude/skills/gas-city-coordinator/SKILL.md')
    .toLowerCase()
    .replace(/\s+/g, ' ')}`

  for (const boundary of [
    'merge',
    'publishing',
    'destructive cleanup',
    'credential actions',
    'authority changes',
  ]) {
    assert.match(
      contract,
      new RegExp(`${boundary}[^.]*operator confirmation`),
      `missing attended boundary for ${boundary}`,
    )
  }
  assert.doesNotMatch(contract, /autonomous(?:ly)? (?:merge|publish)/)
})

test('denies the observed planning-base selection because catalog is authoritative', () => {
  const fixture = JSON.parse(
    read('tests/agent-skills/fixtures/gas-city-formula-selection-failure.json'),
  )

  assert.ok(
    fixture.nonAuthorityEvidence.formulaList.some(({ name }) => name === fixture.requestedFormula),
  )
  assert.equal(
    fixture.catalog.formulas.some(({ name }) => name === fixture.requestedFormula),
    false,
  )
  assert.deepEqual(
    evaluateFormulaEntrypoint({
      requestedFormula: fixture.requestedFormula,
      catalog: fixture.catalog,
      ...fixture.nonAuthorityEvidence,
    }),
    fixture.expectedDecision,
  )
})

test('formula discovery evidence cannot upgrade a non-catalog formula', () => {
  const catalog = {
    schema_version: '1',
    ok: true,
    formulas: [{ name: 'build-from-requirements' }],
  }

  for (const nonAuthorityEvidence of [
    { formulaList: [{ name: 'planning-base' }] },
    { filename: 'planning-base.formula.toml' },
    { resolverSuggestions: ['planning-base'] },
    {
      formulaList: [{ name: 'planning-base' }],
      filename: 'planning-base.formula.toml',
      resolverSuggestions: ['planning-base'],
    },
  ]) {
    assert.equal(
      evaluateFormulaEntrypoint({
        requestedFormula: 'planning-base',
        catalog,
        ...nonAuthorityEvidence,
      }).allowed,
      false,
    )
  }
})

test('catalog guard CLI exits nonzero before a denied formula can continue', () => {
  const fixture = JSON.parse(
    read('tests/agent-skills/fixtures/gas-city-formula-selection-failure.json'),
  )
  const result = spawnSync(
    process.execPath,
    ['scripts/agent-skills/formula-catalog-guard.mjs', '--formula', fixture.requestedFormula],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      input: JSON.stringify(fixture.catalog),
    },
  )

  assert.equal(result.status, 3)
  assert.equal(result.stderr, '')
  assert.deepEqual(JSON.parse(result.stdout), fixture.expectedDecision)
})

test('catalog guard allows exact entries and fails closed on malformed catalogs', () => {
  assert.deepEqual(
    evaluateFormulaEntrypoint({
      requestedFormula: 'build-from-requirements',
      catalog: {
        schema_version: '1',
        ok: true,
        formulas: [{ name: 'build-from-requirements' }],
      },
    }),
    {
      allowed: true,
      authority: 'gc formula catalog',
      category: 'catalog_entry',
      formula: 'build-from-requirements',
    },
  )

  for (const catalog of [
    undefined,
    null,
    {},
    { ok: false, formulas: [] },
    { ok: true },
    { ok: true, formulas: [{ source: 'planning-base.formula.toml' }] },
    { ok: true, formulas: [{ name: 'planning-base' }, { name: 'planning-base' }] },
  ]) {
    assert.equal(
      evaluateFormulaEntrypoint({ requestedFormula: 'planning-base', catalog }).allowed,
      false,
    )
  }
})

test('coordinator stops unknown formulas before cook or dispatch', () => {
  const skill = read('.claude/skills/gas-city-coordinator/SKILL.md')
    .toLowerCase()
    .replace(/\s+/g, ' ')

  assert.match(skill, /gc formula catalog/)
  assert.match(skill, /catalog.*sole.*entrypoint authority/)
  assert.match(skill, /formula list.*not.*authority/)
  assert.match(skill, /filenames?.*not.*authority/)
  assert.match(skill, /resolver suggestions?.*not.*authority/)
  assert.match(skill, /planning-base.*absent.*catalog/)
  assert.match(skill, /stop.*before.*gc formula cook/)
  assert.match(skill, /stop.*before.*gc sling/)
})

test('CI enforces native coordination without reviving legacy witness authority', () => {
  const workflow = read('.github/workflows/ci.yml')

  assert.match(workflow, /- name: Native Beads and Gas City authority/)
  assert.match(workflow, /id: native_coordination/)
  assert.match(workflow, /node --test tests\/agent-skills\/gas-city-coordinator\.test\.mjs/)
  assert.match(workflow, /Frozen Taskmaster archive integrity/)
  assert.match(workflow, /Frozen Aegis archive integrity/)
  assert.doesNotMatch(workflow, /check-aegis\.py --witness/)
  assert.doesNotMatch(workflow, /AEGIS_WITNESS/)
})
