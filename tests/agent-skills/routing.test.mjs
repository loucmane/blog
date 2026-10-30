import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  selectSkills,
  taskIntentUnits,
  validateRoutingConfig,
} from '../../scripts/agent-skills/routing.mjs'

const json = (name) => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), 'utf8'))
const config = {
  catalog: json('../../config/agent-skills/catalog.yaml'),
  reviewMap: json('../../config/agent-skills/review-map.yaml'),
}
const fixtures = json('./fixtures/routing.json')

test('all registered skills have explicit positive, negative and ambiguous path and text cases', () => {
  assert.deepEqual(Object.keys(fixtures).sort(), config.catalog.skills.map(({ id }) => id).sort())
  for (const [skill, cases] of Object.entries(fixtures)) {
    const required = [
      'pathAmbiguous',
      'pathNegative',
      'pathPositive',
      'textAmbiguous',
      'textNegative',
      'textPositive',
    ]
    assert.ok(
      required.every((kind) => Object.hasOwn(cases, kind)),
      `${skill}: core fixtures`,
    )
    for (const [kind, fixture] of Object.entries(cases)) {
      assert.match(kind, /(?:Positive|Negative|Ambiguous)$/)
      assert.equal(fixture.expected.includes(skill), !kind.endsWith('Negative'), `${skill}/${kind}`)
      assert.ok(fixture.rationale.length > 15)
    }
  }
})

for (const [skill, cases] of Object.entries(fixtures)) {
  for (const [kind, { paths, taskText, expected }] of Object.entries(cases)) {
    test(`${skill}: ${kind}`, () => {
      const result = selectSkills({ paths, taskText }, config)
      assert.deepEqual(result.skills, [...expected].sort())
      assert.equal(result.mode, 'advisory')
      assert.equal(result.blocking, false)
      assert.deepEqual(
        result,
        selectSkills(
          { paths: [...paths].reverse(), taskText },
          {
            catalog: { ...config.catalog, skills: [...config.catalog.skills].reverse() },
            reviewMap: { ...config.reviewMap, routes: [...config.reviewMap.routes].reverse() },
          },
        ),
      )
    })
  }
}

test('path evidence survives text exclusions, with stable deduplicated reasons', () => {
  const result = selectSkills(
    {
      paths: [
        './packages/web/src/server/content/document.ts',
        'packages\\web\\src\\server\\content\\document.ts',
      ],
      taskText: 'Review backend data design, node and mark types, and rich-content sanitization.',
    },
    config,
  )
  assert.deepEqual(result.skills, [
    'content-platform-backend',
    'editorial-blocks',
    'security-identity-privacy',
  ])
  assert.equal(new Set(result.matches.map((m) => JSON.stringify(m))).size, result.matches.length)
  assert.ok(
    result.matches.filter(({ kind }) => kind === 'path').every(({ context }) => context.length > 0),
  )
})

test('shared-path context is affirmative, scoped to its path and recorded as evidence', () => {
  for (const route of config.reviewMap.routes.filter(({ pathContext }) => pathContext)) {
    assert.deepEqual(json(`./fixtures/${route.id}.json`).pathContext, route.pathContext)
  }
  const shared = 'packages/web/src/server/content/document.ts'
  assert.deepEqual(selectSkills({ paths: [shared] }, config).skills, [])
  assert.deepEqual(
    selectSkills({ paths: [shared], taskText: 'Tighten safe-url credentials checks.' }, config)
      .skills,
    ['security-identity-privacy'],
  )
  const route = config.reviewMap.routes.find(({ id }) => id === 'seo-distribution')
  const scoped = {
    ...config,
    reviewMap: { ...config.reviewMap, routes: [route] },
    catalog: {
      ...config.catalog,
      skills: config.catalog.skills.filter(({ id }) => id === 'seo-distribution'),
    },
  }
  assert.deepEqual(selectSkills({ paths: ['README.md'], taskText: 'metadata' }, scoped).skills, [])
  assert.deepEqual(
    selectSkills({ paths: ['packages/web/src/app/layout.tsx'], taskText: 'metadatabase' }, scoped)
      .skills,
    [],
  )
  const result = selectSkills(
    { paths: ['packages/web/src/app/layout.tsx'], taskText: 'METADATA' },
    scoped,
  )
  assert.deepEqual(result.matches, [
    {
      skill: 'seo-distribution',
      route: 'seo-distribution',
      kind: 'path',
      value: 'packages/web/src/app/layout.tsx',
      pattern: 'packages/web/src/app/layout.tsx',
      context: ['metadata'],
      contextEvidence: [{ text: 'metadata', section: 'task', line: 1 }],
    },
  ])
  assert.deepEqual(selectSkills({ paths: ['packages/web/public/robots.txt'] }, scoped).skills, [
    'seo-distribution',
  ])
})

test('overlapping context rules all apply regardless of config order', () => {
  const custom = structuredClone(config)
  const route = custom.reviewMap.routes.find(({ id }) => id === 'seo-distribution')
  route.pathContext.push({
    match: ['packages/web/src/app/**'],
    includeAny: ['distribution change'],
  })
  const input = { paths: ['packages/web/src/app/layout.tsx'], taskText: 'metadata' }
  assert.ok(!selectSkills(input, custom).skills.includes('seo-distribution'))
  input.taskText += ' and distribution change'
  const result = selectSkills(input, custom)
  assert.ok(result.skills.includes('seo-distribution'))
  route.pathContext.reverse()
  route.pathContext.forEach(({ includeAny }) => includeAny.reverse())
  assert.deepEqual(selectSkills(input, custom), result)
})

test('text matching uses phrase boundaries, whitespace folding and case folding', () => {
  assert.deepEqual(
    selectSkills({ taskText: 'Consider a quadrangle and RSSify.' }, config).skills,
    [],
  )
  assert.deepEqual(selectSkills({ taskText: 'Review CANONICAL\n URLs.' }, config).skills, [
    'seo-distribution',
  ])
})

test('sections resume at peers and retain exact evidence for affirmative task clauses', () => {
  const taskText =
    '# Summary\nReview canonical URLs.\n## Verification\nReview test strategy.\n### Details\nReview upload security.\n## Changes\nReview skill routing.'
  const result = selectSkills({ taskText }, config)
  assert.deepEqual(result.skills, ['cross-agent-skill-platform', 'seo-distribution'])
  assert.deepEqual(
    result.matches.find(({ skill }) => skill === 'cross-agent-skill-platform'),
    {
      skill: 'cross-agent-skill-platform',
      route: 'cross-agent-skill-platform',
      kind: 'task-text',
      value: 'skill routing',
      text: 'review skill routing.',
      section: 'Changes',
      line: 8,
    },
  )
})

test('ignored or negated prose cannot satisfy a shared path context', () => {
  const paths = ['packages/web/src/app/layout.tsx']
  for (const taskText of [
    'No metadata changes.',
    '## Verification\nCanonical metadata checked.',
    '> metadata\n\nReview responsive images.',
    '~~~text\nmetadata\n~~~~\nReview responsive images.',
    'Previously: metadata. Review responsive images.',
  ])
    assert.deepEqual(selectSkills({ paths, taskText }, config).skills, ['reader-frontend'])
  assert.ok(
    selectSkills(
      { paths, taskText: 'No metadata changes; review canonical URLs.' },
      config,
    ).skills.includes('seo-distribution'),
  )
})

test('owner context is affirmative and belongs to the same clause as the trigger', () => {
  for (const taskText of [
    'Review revisions; ask the owner later.',
    'Review revisions without owner workflow.',
  ])
    assert.deepEqual(selectSkills({ taskText }, config).skills, [])
  const result = selectSkills({ taskText: 'Review revisions for the owner.' }, config)
  assert.deepEqual(result.skills, ['owner-publishing-ux'])
  assert.deepEqual(result.matches[0].context, ['owner'])
})

test('negation is local, supports new imperatives, and does not negate not-only', () => {
  for (const taskText of [
    'Not product discovery, but review stack research.',
    'Do not implement, review stack research.',
    'Review not only stack research.',
    'Review product discovery and review stack research.',
  ])
    assert.ok(selectSkills({ taskText }, config).skills.includes('stack-research-adr'), taskText)
  assert.deepEqual(
    selectSkills({ taskText: 'No stack research or product discovery.' }, config).skills,
    [],
  )
})

test('code, quote and comment boundaries cannot join an unintended phrase', () => {
  assert.deepEqual(
    taskIntentUnits('Review canonical\n> historical text\nURLs.').map(({ text }) => text),
    ['review canonical', 'urls.'],
  )
  assert.deepEqual(selectSkills({ taskText: '```text\nReview canonical URLs.' }, config).skills, [])
  assert.deepEqual(selectSkills({ taskText: '<!-- Review canonical URLs.' }, config).skills, [])
  assert.deepEqual(
    selectSkills(
      { taskText: '## Review release evidence\nPrepare the verification report.' },
      config,
    ).skills,
    ['release-witness'],
  )
})

test('globs keep literal Next route brackets and single-star directory boundaries', () => {
  const custom = structuredClone(config)
  custom.reviewMap.routes[0].match = ['app/[slug]/*.tsx']
  assert.deepEqual(selectSkills({ paths: ['app/[slug]/page.tsx'] }, custom).skills, [
    'cross-agent-skill-platform',
  ])
  for (const file of ['app/s/page.tsx', 'app/[slug]/deep/page.tsx']) {
    assert.deepEqual(selectSkills({ paths: [file] }, custom).skills, [])
  }
})

test('invalid input and malformed configuration fail closed', () => {
  for (const paths of [['../outside'], ['/absolute'], ['C:\\outside'], [42], 'file.ts']) {
    assert.throws(() => selectSkills({ paths }, config), /paths/)
  }
  assert.throws(() => selectSkills({ taskText: null }, config), /taskText/)
  for (const contextAny of [null, {}, [], [''], [42]]) {
    const changed = structuredClone(config)
    changed.reviewMap.routes[0].taskText.contextAny = contextAny
    assert.throws(() => selectSkills({}, changed), /contextAny/)
  }
  for (const pathContext of [
    null,
    {},
    [],
    [null],
    [{ match: ['../bad'], includeAny: ['metadata'] }],
    [{ match: ['app/**'], includeAny: [] }],
    [{ match: ['app/**'], includeAny: [''] }],
  ]) {
    const changed = structuredClone(config)
    changed.reviewMap.routes[0].pathContext = pathContext
    assert.throws(() => selectSkills({}, changed), /pathContext/)
  }
  for (const mutate of [
    (c) => {
      c.reviewMap.routes[0].skills = ['unknown']
    },
    (c) => {
      c.reviewMap.routes[0].taskText.includeAny = ['']
    },
    (c) => {
      c.reviewMap.routes[0].match = ['../outside/**']
    },
    (c) => {
      c.reviewMap.routes[0].mode = 'blocking'
    },
    (c) => {
      c.catalog.skills[0].status = 'banana'
    },
    (c) => {
      c.catalog.policy.blockingEligibleCategories.push('taste')
    },
  ]) {
    const changed = structuredClone(config)
    mutate(changed)
    assert.ok(validateRoutingConfig(changed).length > 0)
    assert.throws(() => selectSkills({}, changed), /Invalid routing configuration/)
  }
})

test('every skill has lifecycle criteria and inactive skills never auto-select', () => {
  assert.deepEqual(validateRoutingConfig(config), [])
  for (const skill of config.catalog.skills) {
    for (const phase of ['promotion', 'revision', 'retirement']) {
      const changed = structuredClone(config)
      delete changed.catalog.skills.find(({ id }) => id === skill.id).lifecycle[phase]
      assert.ok(
        validateRoutingConfig(changed).some((e) => e.includes(`${skill.id}.lifecycle.${phase}`)),
      )
    }
  }
  for (const status of ['candidate', 'retired']) {
    const changed = structuredClone(config)
    changed.catalog.skills.find(({ id }) => id === 'reader-frontend').status = status
    assert.deepEqual(
      selectSkills({ paths: ['packages/web/src/reader/feature.tsx'] }, changed).skills,
      [],
    )
  }
})
