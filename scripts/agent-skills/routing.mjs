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
const pathPatterns = (value) =>
  strings(value) && value.every((pattern) => validPath(pattern) && !pattern.includes('\\'))

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
    if (!pathPatterns(route.match)) {
      errors.push(`${route.id}: match requires repository-relative path globs`)
    }
    // Shared files need affirmative domain context; dedicated paths stay sufficient alone.
    if (
      route.pathContext !== undefined &&
      (!Array.isArray(route.pathContext) ||
        route.pathContext.length === 0 ||
        route.pathContext.some((rule) => !pathPatterns(rule?.match) || !strings(rule?.includeAny)))
    ) {
      errors.push(`${route.id}: pathContext requires path globs and nonempty includeAny phrases`)
    }
    if (!strings(route.taskText?.includeAny) || !strings(route.taskText?.excludeAny, true)) {
      errors.push(`${route.id}: taskText requires nonempty includeAny and an excludeAny array`)
    }
    if (route.taskText?.contextAny !== undefined && !strings(route.taskText.contextAny)) {
      errors.push(`${route.id}: taskText.contextAny requires nonempty phrases`)
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

function phrasePattern(phrase, flags = 'u') {
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}_-])${escape(normalized(phrase)).replace(/\*/g, '\\*')}(?=$|[^\\p{L}\\p{N}_-])`,
    flags,
  )
}

// Input contract: title + Markdown body. This is a deterministic lexical filter,
// not natural-language understanding. Keep intent in Summary/Changes or ordinary
// paragraphs. Ignore fenced code, blockquotes, HTML comments and sections named
// Verification/Testing/Host checks/Review/History/Previous work/Related work/
// Background/Out of scope (including their subheadings). A same-or-shallower
// heading resumes input. Plain "Verification:" labels act as level-2 headings.
// Ignore sentences starting with historical markers or a PR reference list item;
// a reference embedded in a current request does not erase that request.
// Soft line wraps join; paragraphs, list items and headings are boundaries.
// Sentences, semicolons, contrast words and a new imperative after comma/"and"
// delimit clauses. Include/exclude/context phrases all use affirmative occurrences
// in ONE clause. An exclusion never vetoes a separate clause or dedicated path.
// no/not/never/without/excluding/except and negative contractions negate the
// rest of a clause (except "not
// only"). This intentionally does not infer double negation, sarcasm or pronouns.
// contextAny disambiguates generic vocabulary (e.g. owner revisions vs DB rows).
// Path context uses these same affirmative units, without taskText exclusions.
// Evidence includes normalized clause, section and starting source line; this is
// review evidence, not authority. Exact source text remains with the caller.
const ignoredSection =
  /^(?:verification|testing|tests|test plan|host checks|review|history|previous work|earlier work|related work|background|out of scope)(?:\s*\([^)]*\))?\s*:?$/i
const historical =
  /^(?:follow[- ]up to\b|previously\b|historically\b|earlier work\b|from (?:the )?review of\b|(?:pr\s*)?#\d+\s*[:–—-])/i
const inlineBoilerplate =
  /^(?:verification|host checks|testing|test plan|review|previous work|earlier work|related work|out of scope)\s*:/i

export function taskIntentUnits(taskText) {
  const units = []
  let section = 'task',
    ignoredLevel = null,
    fence = null,
    paragraph = '',
    startLine = 1
  const flush = () => {
    for (const sentence of paragraph.split(
      /(?:[.!?]\s+|;\s*|\s+(?:but|however|whereas|instead)\s+|(?:,\s*|\s+and\s+)(?=(?:review|design|implement|assess|plan|add|fix)\b))/i,
    )) {
      const text = normalized(sentence)
      if (inlineBoilerplate.test(text)) break
      if (text && !historical.test(text)) units.push({ text, section, line: startLine })
    }
    paragraph = ''
  }
  // Preserve line numbers while removing comments, including unterminated ones.
  const source = taskText.replace(/<!--[\s\S]*?(?:-->|$)/g, (comment) =>
    comment.replace(/[^\n]/g, ' '),
  )
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const line = raw.trim()
    const marker = line.match(/^(`{3,}|~{3,})/)
    if (fence) {
      if (
        marker &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length &&
        /^\s*$/.test(line.slice(marker[1].length))
      )
        fence = null
      continue
    }
    if (marker) {
      flush()
      fence = marker[1]
      continue
    }
    if (/^>/.test(line)) {
      flush()
      continue
    }
    const cleaned = line.replace(/[*_`]/g, '')
    const heading = cleaned.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/)
    const plainHeading =
      !heading && (ignoredSection.test(cleaned) || inlineBoilerplate.test(cleaned))
    if (heading || plainHeading) {
      flush()
      const level = heading ? heading[1].length : 2
      const title = heading ? heading[2] : cleaned.split(':')[0]
      if (ignoredLevel !== null && level > ignoredLevel) continue
      ignoredLevel = ignoredSection.test(title) ? level : null
      section = title.replace(/:$/, '')
      if (ignoredLevel === null) units.push({ text: normalized(title), section, line: index + 1 })
      continue
    }
    if (ignoredLevel !== null) continue
    if (!line) {
      flush()
      continue
    }
    const item = cleaned.replace(/^(?:[-+]\s+|\d+[.)]\s+|\[.\]\s+)/, '')
    if (/^(?:[-+*]\s+|\d+[.)]\s+)/.test(line)) flush()
    if (!paragraph) startLine = index + 1
    paragraph += ` ${item}`
  }
  flush()
  return units
}

function affirmative(text, phrase) {
  for (const match of text.matchAll(phrasePattern(phrase, 'gu'))) {
    const prefix = text
      .slice(0, match.index)
      .replace(/\bnot only\b/g, '')
      .replace(
        /\b(?:don't|doesn't|didn't|isn't|aren't|wasn't|weren't|won't|can't|cannot)\b/g,
        'not',
      )
      .replace(/\b(?:don’t|doesn’t|didn’t|isn’t|aren’t|wasn’t|weren’t|won’t|can’t)\b/g, 'not')
    if (
      !/(?:^|[^\p{L}\p{N}_-])(?:no|not|never|without|excluding|except)(?=$|[^\p{L}\p{N}_-])/u.test(
        prefix,
      )
    )
      return true
  }
  return false
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
  const units = taskIntentUnits(taskText)
  const active = new Set(
    config.catalog.skills.filter(({ status }) => status === 'active').map(({ id }) => id),
  )
  const matches = []
  for (const route of config.reviewMap.routes) {
    const evidence = []
    for (const pattern of unique(route.match)) {
      for (const file of files) {
        if (!matchesPath(pattern, file)) continue
        const contexts = (route.pathContext ?? []).filter((rule) =>
          rule.match.some((glob) => matchesPath(glob, file)),
        )
        const phrases = contexts.map((rule) =>
          unique(rule.includeAny.map(normalized)).filter((phrase) =>
            units.some(({ text }) => affirmative(text, phrase)),
          ),
        )
        // Every applicable context rule must be satisfied. No rule can create a path match.
        if (phrases.some((matched) => matched.length === 0)) continue
        evidence.push({
          kind: 'path',
          value: file,
          pattern,
          ...(contexts.length
            ? {
                context: unique(phrases.flat()),
                contextEvidence: units.filter(({ text }) =>
                  phrases.flat().some((phrase) => affirmative(text, phrase)),
                ),
              }
            : {}),
        })
      }
    }
    for (const unit of units) {
      if (route.taskText.excludeAny.some((phrase) => affirmative(unit.text, phrase))) continue
      const context = unique((route.taskText.contextAny ?? []).map(normalized)).filter((phrase) =>
        affirmative(unit.text, phrase),
      )
      if (route.taskText.contextAny && !context.length) continue
      for (const phrase of unique(route.taskText.includeAny.map(normalized))) {
        if (affirmative(unit.text, phrase))
          evidence.push({
            kind: 'task-text',
            value: phrase,
            ...unit,
            ...(context.length ? { context } : {}),
          })
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
