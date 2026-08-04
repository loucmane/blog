import process from 'node:process'
import { pathToFileURL } from 'node:url'

const authority = 'gc formula catalog'
const stopBefore = ['gc formula cook', 'gc sling', 'workflow bead creation']

const denied = (category, formula = null) => ({
  allowed: false,
  authority,
  category,
  formula,
  stopBefore: [...stopBefore],
})

const catalogFormulaNames = (catalog) => {
  if (
    catalog === null ||
    typeof catalog !== 'object' ||
    catalog.schema_version !== '1' ||
    catalog.ok !== true ||
    !Array.isArray(catalog.formulas)
  ) {
    return null
  }

  const names = []
  for (const entry of catalog.formulas) {
    if (
      entry === null ||
      typeof entry !== 'object' ||
      typeof entry.name !== 'string' ||
      entry.name.trim() !== entry.name ||
      entry.name.length === 0
    ) {
      return null
    }
    names.push(entry.name)
  }

  if (new Set(names).size !== names.length) return null
  if (
    catalog.summary !== undefined &&
    (catalog.summary === null ||
      typeof catalog.summary !== 'object' ||
      catalog.summary.count !== names.length)
  ) {
    return null
  }

  return new Set(names)
}

export const evaluateFormulaEntrypoint = ({ requestedFormula, catalog } = {}) => {
  if (
    typeof requestedFormula !== 'string' ||
    requestedFormula.trim() !== requestedFormula ||
    requestedFormula.length === 0
  ) {
    return denied('invalid_formula_request')
  }

  const catalogNames = catalogFormulaNames(catalog)
  if (catalogNames === null) {
    return denied('catalog_invalid_or_unavailable', requestedFormula)
  }

  if (!catalogNames.has(requestedFormula)) {
    return denied('formula_not_cataloged', requestedFormula)
  }

  return {
    allowed: true,
    authority,
    category: 'catalog_entry',
    formula: requestedFormula,
  }
}

const readStdin = async () => {
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  return input
}

const run = async () => {
  const formulaIndex = process.argv.indexOf('--formula')
  const requestedFormula = formulaIndex >= 0 ? process.argv[formulaIndex + 1] : undefined

  let catalog
  try {
    catalog = JSON.parse(await readStdin())
  } catch {
    catalog = null
  }

  const decision = evaluateFormulaEntrypoint({ requestedFormula, catalog })
  process.stdout.write(`${JSON.stringify(decision)}\n`)
  process.exitCode = decision.allowed ? 0 : 3
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run()
}
