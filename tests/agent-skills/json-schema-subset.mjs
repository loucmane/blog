// Test-only evaluator for the review-result schema's assertion vocabulary.
// Compile every subschema eagerly: unsupported assertions must throw even in
// properties or conditional branches that the current corpus never reaches.
const keywords = new Set([
  '$id',
  '$schema',
  'title',
  'description',
  'type',
  'required',
  'properties',
  'additionalProperties',
  'enum',
  'const',
  'minLength',
  'pattern',
  'format',
  'items',
  'minItems',
  'maxItems',
  'allOf',
  'if',
  'then',
])
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const types = {
  object: isObject,
  array: Array.isArray,
  string: (value) => typeof value === 'string',
  boolean: (value) => typeof value === 'boolean',
  null: (value) => value === null,
  number: (value) => typeof value === 'number' && Number.isFinite(value),
  integer: Number.isInteger,
}

function equalJson(left, right) {
  if (left === right) return true
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((item, index) => equalJson(item, right[index]))
    )
  }
  if (!isObject(left) || !isObject(right)) return false
  return (
    Object.keys(left).length === Object.keys(right).length &&
    Object.keys(left).every((key) => Object.hasOwn(right, key) && equalJson(left[key], right[key]))
  )
}

// Independently assert the published RFC 3339 profile, without Date.parse or
// the runtime validator: Gregorian calendar, mandatory seconds/zone, no leap
// seconds. Year 0000 and numeric offsets through 23:59 are in this profile.
function dateTime(value) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[Tt](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:[Zz]|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
      value,
    )
  if (!match || match[0] !== value) return false
  const [, year, month, day] = match.map(Number)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
}

/** Compile this subset to a validator returning structural error strings. */
export function compileSchema(schema) {
  function compile(node, location) {
    function requireShape(condition, detail) {
      if (!condition) throw new Error(`${location}: ${detail}`)
    }
    requireShape(isObject(node), 'schema must be an object in this subset')
    for (const keyword of Object.keys(node)) {
      requireShape(keywords.has(keyword), `unsupported schema keyword ${keyword}`)
    }
    const checks = []
    if (Object.hasOwn(node, 'type')) {
      requireShape(
        typeof node.type === 'string' && Object.hasOwn(types, node.type),
        'unsupported type',
      )
      checks.push((value, at, errors) => {
        if (!types[node.type](value)) errors.push(`${at}: type must be ${node.type}`)
      })
    }
    if (Object.hasOwn(node, 'const')) {
      checks.push((value, at, errors) => {
        if (!equalJson(value, node.const)) errors.push(`${at}: const mismatch`)
      })
    }
    if (Object.hasOwn(node, 'enum')) {
      requireShape(
        Array.isArray(node.enum) && node.enum.length > 0,
        'enum must be a nonempty array',
      )
      checks.push((value, at, errors) => {
        if (!node.enum.some((option) => equalJson(value, option)))
          errors.push(`${at}: enum mismatch`)
      })
    }
    if (Object.hasOwn(node, 'required')) {
      requireShape(
        Array.isArray(node.required) && node.required.every((key) => typeof key === 'string'),
        'required must be an array of strings',
      )
      checks.push((value, at, errors) => {
        if (!isObject(value)) return
        for (const key of node.required) {
          if (!Object.hasOwn(value, key)) errors.push(`${at}: required property ${key}`)
        }
      })
    }
    const properties = new Map()
    if (Object.hasOwn(node, 'properties')) {
      requireShape(isObject(node.properties), 'properties must be an object')
      for (const [key, child] of Object.entries(node.properties)) {
        properties.set(key, compile(child, `${location}/properties/${key}`))
      }
      checks.push((value, at, errors) => {
        if (!isObject(value)) return
        for (const [key, validate] of properties) {
          if (Object.hasOwn(value, key)) validate(value[key], `${at}/${key}`, errors)
        }
      })
    }
    if (Object.hasOwn(node, 'additionalProperties')) {
      requireShape(
        node.additionalProperties === false,
        'only additionalProperties: false is supported',
      )
      checks.push((value, at, errors) => {
        if (!isObject(value)) return
        for (const key of Object.keys(value)) {
          if (!properties.has(key)) errors.push(`${at}: additional property ${key}`)
        }
      })
    }
    for (const keyword of ['minLength', 'minItems', 'maxItems']) {
      if (!Object.hasOwn(node, keyword)) continue
      requireShape(
        Number.isInteger(node[keyword]) && node[keyword] >= 0,
        `${keyword} must be a nonnegative integer`,
      )
      checks.push((value, at, errors) => {
        if (keyword === 'minLength') {
          if (typeof value === 'string' && [...value].length < node[keyword])
            errors.push(`${at}: minLength`)
        } else if (Array.isArray(value)) {
          if (keyword === 'minItems' ? value.length < node[keyword] : value.length > node[keyword])
            errors.push(`${at}: ${keyword}`)
        }
      })
    }
    if (Object.hasOwn(node, 'pattern')) {
      requireShape(typeof node.pattern === 'string', 'pattern must be a string')
      const pattern = new RegExp(node.pattern, 'u')
      checks.push((value, at, errors) => {
        if (typeof value === 'string' && !pattern.test(value))
          errors.push(`${at}: pattern mismatch`)
      })
    }
    if (Object.hasOwn(node, 'format')) {
      requireShape(node.format === 'date-time', 'unsupported format')
      checks.push((value, at, errors) => {
        if (typeof value === 'string' && !dateTime(value)) errors.push(`${at}: invalid date-time`)
      })
    }
    if (Object.hasOwn(node, 'items')) {
      const validate = compile(node.items, `${location}/items`)
      checks.push((value, at, errors) => {
        if (Array.isArray(value))
          value.forEach((item, index) => validate(item, `${at}/${index}`, errors))
      })
    }
    if (Object.hasOwn(node, 'allOf')) {
      requireShape(
        Array.isArray(node.allOf) && node.allOf.length > 0,
        'allOf must be a nonempty array',
      )
      checks.push(...node.allOf.map((child, index) => compile(child, `${location}/allOf/${index}`)))
    }
    const condition = Object.hasOwn(node, 'if') ? compile(node.if, `${location}/if`) : null
    const consequent = Object.hasOwn(node, 'then') ? compile(node.then, `${location}/then`) : null
    if (condition && consequent) {
      checks.push((value, at, errors) => {
        const conditionErrors = []
        condition(value, at, conditionErrors)
        if (conditionErrors.length === 0) consequent(value, at, errors)
      })
    }
    return (value, at, errors) => {
      for (const check of checks) check(value, at, errors)
    }
  }

  const validate = compile(schema, 'schema')
  return (value) => {
    const errors = []
    validate(value, '$', errors)
    return errors
  }
}
