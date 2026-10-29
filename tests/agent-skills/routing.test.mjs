import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import { selectSkills, validateRoutingConfig } from '../../scripts/agent-skills/routing.mjs'

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
      taskText: 'Review backend data design and sanitization.',
    },
    config,
  )
  assert.deepEqual(result.skills, [
    'content-platform-backend',
    'editorial-blocks',
    'security-identity-privacy',
  ])
  assert.equal(new Set(result.matches.map((m) => JSON.stringify(m))).size, result.matches.length)
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
