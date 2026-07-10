import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourcePath = path.join(root, '.taskmaster/tasks/tasks.json')
const payload = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const tasks = payload?.master?.tasks
const errors = []

if (!Array.isArray(tasks)) {
  errors.push('master.tasks must be an array')
}

const taskList = Array.isArray(tasks) ? tasks : []
const allowedStatuses = new Set([
  'pending',
  'in-progress',
  'review',
  'deferred',
  'cancelled',
  'done',
])
const taskMap = new Map()

for (const task of taskList) {
  const id = String(task.id)
  if (taskMap.has(id)) {
    errors.push(`duplicate task id: ${id}`)
  }
  taskMap.set(id, task)
  if (!allowedStatuses.has(task.status)) {
    errors.push(`task ${id} has invalid status: ${task.status}`)
  }
  if (!Array.isArray(task.dependencies)) {
    errors.push(`task ${id} dependencies must be an array`)
  }
}

for (const [id, task] of taskMap) {
  for (const dependency of task.dependencies ?? []) {
    const dependencyId = String(dependency)
    if (!taskMap.has(dependencyId)) {
      errors.push(`task ${id} has missing dependency: ${dependencyId}`)
    }
    if (dependencyId === id) {
      errors.push(`task ${id} depends on itself`)
    }
  }
}

const visiting = new Set()
const visited = new Set()

function visit(id, trail = []) {
  if (visiting.has(id)) {
    errors.push(`dependency cycle: ${[...trail, id].join(' -> ')}`)
    return
  }
  if (visited.has(id)) {
    return
  }
  visiting.add(id)
  const task = taskMap.get(id)
  for (const dependency of task?.dependencies ?? []) {
    visit(String(dependency), [...trail, id])
  }
  visiting.delete(id)
  visited.add(id)
}

for (const id of taskMap.keys()) {
  visit(id)
}

function dependsTransitively(taskId, requiredId, seen = new Set()) {
  if (seen.has(taskId)) {
    return false
  }
  seen.add(taskId)
  const task = taskMap.get(taskId)
  return (task?.dependencies ?? []).some(dependency => {
    const dependencyId = String(dependency)
    return dependencyId === requiredId || dependsTransitively(dependencyId, requiredId, seen)
  })
}

if (taskMap.get('36')?.status !== 'done') {
  errors.push('Task 36 must be done before protected CI')
}
if (!(taskMap.get('48')?.dependencies ?? []).map(String).includes('36')) {
  errors.push('Task 48 must depend directly on Task 36')
}
if (!(taskMap.get('38')?.dependencies ?? []).map(String).includes('48')) {
  errors.push('Task 38 must depend directly on Task 48')
}
for (let id = 39; id <= 47; id += 1) {
  if (!dependsTransitively(String(id), '48')) {
    errors.push(`Task ${id} must depend transitively on Task 48`)
  }
}

const report = {
  checkedTasks: taskList.length,
  dependencyCount: taskList.reduce(
    (count, task) => count + (Array.isArray(task.dependencies) ? task.dependencies.length : 0),
    0,
  ),
  errors,
  status: errors.length === 0 ? 'passed' : 'failed',
}

fs.mkdirSync(path.join(root, 'ci-artifacts'), { recursive: true })
fs.writeFileSync(
  path.join(root, 'ci-artifacts/taskmaster-health.json'),
  `${JSON.stringify(report, null, 2)}\n`,
)
console.log(JSON.stringify(report, null, 2))

if (errors.length > 0) {
  process.exit(1)
}
