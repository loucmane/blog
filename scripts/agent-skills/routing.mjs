// Deterministic advisory routing. No model, filesystem, network or execution authority.
export const blockingEligibleCategories = [
  'schema',
  'link',
  'script',
  'test',
  'build',
  'typecheck',
  'lint',
  'security',
  'accessibility',
  'performance-budget',
  'health',
  'critical-browser',
]

const strings = (value, allowEmpty = false) =>
  Array.isArray(value) &&
  (allowEmpty || value.length > 0) &&
  value.every((item) => typeof item === 'string' && item.trim().length > 0)
const normalized = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim()
const unique = (values) => [...new Set(values)].sort()
const escape = (value) => value.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
const validPath = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  !/^[/\\]|^[a-z]:|[\0\r\n]/i.test(value) &&
  !value.split('/').some((part) => !part || part === '..' || part === '.')

export function validateRoutingConfig({ catalog, reviewMap } = {}) {
  const errors = []
  if (!Array.isArray(catalog?.skills) || !Array.isArray(reviewMap?.routes)) {
    return ['catalog.skills and reviewMap.routes must be arrays']
  }
  if (catalog.schemaVersion !== 1 || reviewMap.schemaVersion !== 1)
    errors.push('routing schemaVersion must equal 1')
  if (catalog.policy?.subjectiveFindings !== 'advisory' || reviewMap.defaultMode !== 'advisory') {
    errors.push('subjective findings and default mode must remain advisory')
  }
  const categories = catalog.policy?.blockingEligibleCategories
  if (
    !strings(categories) ||
    categories.some((item) => !blockingEligibleCategories.includes(item))
  ) {
    errors.push('blockingEligibleCategories must contain only deterministic check classes')
  }
  const ids = new Set()
  for (const skill of catalog.skills) {
    if (!skill || typeof skill.id !== 'string' || ids.has(skill.id)) {
      errors.push('catalog skill IDs must be unique strings')
      continue
    }
    ids.add(skill.id)
    if (!['candidate', 'active', 'retired'].includes(skill.status))
      errors.push(`${skill.id}: invalid lifecycle status`)
    for (const phase of ['promotion', 'revision', 'retirement']) {
      if (!strings(skill.lifecycle?.[phase]))
        errors.push(`${skill.id}.lifecycle.${phase} requires criteria`)
    }
  }
  const routes = new Set()
  for (const route of reviewMap.routes) {
    if (!route || typeof route.id !== 'string' || routes.has(route.id)) {
      errors.push('route IDs must be unique strings')
      continue
    }
    routes.add(route.id)
    if (route.mode !== 'advisory') errors.push(`${route.id}: mode must remain advisory`)
    if (!strings(route.skills) || route.skills.some((id) => !ids.has(id)))
      errors.push(`${route.id}: unknown or missing skills`)
    if (
      !strings(route.match) ||
      route.match.some((pattern) => !validPath(pattern) || pattern.includes('\\'))
    ) {
      errors.push(`${route.id}: match requires repository-relative path globs`)
    }
    if (!strings(route.taskText?.includeAny) || !strings(route.taskText?.excludeAny, true)) {
      errors.push(`${route.id}: taskText requires nonempty includeAny and an excludeAny array`)
    }
  }
  for (const skill of catalog.skills) {
    if (
      skill?.status === 'active' &&
      !reviewMap.routes.some((route) => route?.skills?.includes(skill.id))
    ) {
      errors.push(`${skill.id}: active skill has no route`)
    }
  }
  return errors
}

function matchesPath(pattern, file) {
  // Only * and ** are operators. Next.js [slug] segments remain literal.
  const expression = pattern
    .split(/(\*\*|\*)/)
    .map((part) => (part === '**' ? '.*' : part === '*' ? '[^/]*' : escape(part)))
    .join('')
  return new RegExp(`^${expression}$`).test(file)
}

function matchesPhrase(text, phrase) {
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}_-])${escape(normalized(phrase)).replace(/\*/g, '\\*')}(?=$|[^\\p{L}\\p{N}_-])`,
    'u',
  ).test(text)
}

export function selectSkills({ paths = [], taskText = '' } = {}, config) {
  const errors = validateRoutingConfig(config)
  if (errors.length) throw new Error(`Invalid routing configuration: ${errors.join('; ')}`)
  if (!Array.isArray(paths)) throw new Error('paths must be an array')
  const files = unique(
    paths.map((file) => {
      if (typeof file !== 'string') throw new Error('paths must contain strings')
      const value = file.replace(/\\/g, '/').replace(/^\.\//, '')
      if (!validPath(value)) throw new Error('paths must be repository-relative without traversal')
      return value
    }),
  )
  if (typeof taskText !== 'string') throw new Error('taskText must be a string')
  const text = normalized(taskText)
  const active = new Set(
    config.catalog.skills.filter(({ status }) => status === 'active').map(({ id }) => id),
  )
  const matches = []
  for (const route of config.reviewMap.routes) {
    const evidence = []
    for (const pattern of unique(route.match)) {
      for (const file of files) {
        if (matchesPath(pattern, file)) evidence.push({ kind: 'path', value: file, pattern })
      }
    }
    if (!route.taskText.excludeAny.some((phrase) => matchesPhrase(text, phrase))) {
      for (const phrase of unique(route.taskText.includeAny.map(normalized))) {
        if (matchesPhrase(text, phrase)) evidence.push({ kind: 'task-text', value: phrase })
      }
    }
    for (const skill of unique(route.skills).filter((id) => active.has(id))) {
      for (const reason of evidence) matches.push({ skill, route: route.id, ...reason })
    }
  }
  matches.sort((a, b) => {
    const left = JSON.stringify(a),
      right = JSON.stringify(b)
    return left < right ? -1 : left > right ? 1 : 0
  })
  return {
    schemaVersion: 1,
    mode: 'advisory',
    blocking: false,
    skills: unique(matches.map(({ skill }) => skill)),
    matches,
  }
}
