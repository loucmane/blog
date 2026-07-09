import fs from 'node:fs'
import path from 'node:path'

const mode = process.argv.at(-1)
if (!['unit', 'browser'].includes(mode)) {
  console.error('Usage: node scripts/ci/check-test-capability.mjs <unit|browser>')
  process.exit(2)
}

const root = process.cwd()
const readJson = relativePath => JSON.parse(
  fs.readFileSync(path.join(root, relativePath), 'utf8'),
)
const manifests = {
  root: readJson('package.json'),
  backend: readJson('packages/backend/package.json'),
  ui: readJson('packages/ui/package.json'),
  web: readJson('packages/web/package.json'),
}
const tasks = readJson('.taskmaster/tasks/tasks.json').master.tasks
const task39 = tasks.find(task => String(task.id) === '39')

function directDependency(manifest, name) {
  return Boolean(manifest.dependencies?.[name] || manifest.devDependencies?.[name])
}

function collectFiles(directory, files = []) {
  if (!fs.existsSync(directory)) {
    return files
  }
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.next', 'coverage'].includes(entry.name)) {
      continue
    }
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      collectFiles(entryPath, files)
    } else {
      files.push(path.relative(root, entryPath))
    }
  }
  return files
}

const packageFiles = collectFiles(path.join(root, 'packages'))
const testFiles = packageFiles.filter(file =>
  /(?:^|\/)(__tests__\/|[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$)/.test(file),
)
const playwrightConfigs = packageFiles.filter(file =>
  /(?:^|\/)playwright\.config\.[cm]?[jt]s$/.test(file),
)
const packageScripts = Object.values(manifests).flatMap(manifest =>
  Object.entries(manifest.scripts ?? {}).map(([name, command]) => ({ name, command })),
)
const browserScripts = packageScripts.filter(({ name, command }) =>
  /(e2e|playwright|accessibility|\ba11y\b|\baxe\b)/i.test(`${name} ${command}`),
)
const directBrowserDependencies = Object.values(manifests).flatMap(manifest =>
  ['@playwright/test', 'playwright', 'axe-core', '@axe-core/playwright'].filter(name =>
    directDependency(manifest, name),
  ),
)

const trackedFollowUp = task39?.status === 'pending'
  && /unit\/integration\/browser foundations/i.test(task39.description ?? '')
const errors = []
let blockers

if (mode === 'unit') {
  blockers = {
    backendHasNoTests: testFiles.filter(file => file.startsWith('packages/backend/')).length === 0,
    uiHasNoDirectJest: !directDependency(manifests.ui, 'jest'),
    webHasNoDirectJest: !directDependency(manifests.web, 'jest'),
  }
  if (!Object.values(blockers).every(Boolean)) {
    errors.push('Unit/integration capability changed; replace this bridge with real test execution')
  }
} else {
  blockers = {
    noPlaywrightConfig: playwrightConfigs.length === 0,
    noBrowserScripts: browserScripts.length === 0,
    noDirectBrowserDependencies: directBrowserDependencies.length === 0,
  }
  if (!Object.values(blockers).every(Boolean)) {
    errors.push('Browser/accessibility capability changed; replace this bridge with real test execution')
  }
}

if (!trackedFollowUp) {
  errors.push('Task 39 must remain the explicit owner for replacing unsupported test bridges')
}

const report = {
  blockers,
  bridgeDeadline: 'Task 39 quality-tooling PR',
  bridgeOwner: 'Task 39',
  errors,
  mode,
  status: errors.length === 0 ? 'unsupported-tracked' : 'failed',
  task39: task39 ? { id: String(task39.id), status: task39.status } : null,
}

fs.mkdirSync(path.join(root, 'ci-artifacts'), { recursive: true })
fs.writeFileSync(
  path.join(root, `ci-artifacts/${mode}-test-capability.json`),
  `${JSON.stringify(report, null, 2)}\n`,
)
console.log(JSON.stringify(report, null, 2))

if (errors.length > 0) {
  process.exit(1)
}
