import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'


const workflowPath = new URL('../../.github/workflows/auto-merge.yml', import.meta.url)
const workflow = fs.readFileSync(workflowPath, 'utf8')


test('handles both CI-completion and label-ordering races', () => {
  assert.match(workflow, /^  workflow_run:\n    workflows: \[CI\]\n    types: \[completed\]$/m)
  assert.match(workflow, /^  pull_request:\n    types: \[labeled\]$/m)
  assert.doesNotMatch(workflow, /pull_request_target/)
  assert.match(workflow, /workflow_run\.pull_requests/)
  assert.match(workflow, /-f head="\$REPOSITORY_OWNER:\$WORKFLOW_HEAD_BRANCH"/)
})


test('grants write access only to contents and pull requests in the merge job', () => {
  assert.match(workflow, /^permissions: \{\}$/m)
  assert.match(
    workflow,
    /^    permissions:\n      contents: write\n      pull-requests: write$/m,
  )
  assert.doesNotMatch(workflow, /^      (actions|checks|deployments|id-token|packages|security-events):/m)
  assert.doesNotMatch(workflow, /secrets\./)
})


test('executes trusted default-branch policy instead of pull-request code', () => {
  assert.match(workflow, /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/)
  assert.match(workflow, /persist-credentials: false/)
  assert.match(workflow, /node trusted\/scripts\/ci\/auto-merge-policy\.mjs classify/)
  assert.match(workflow, /node trusted\/scripts\/ci\/auto-merge-policy\.mjs checks/)
})


test('directly inspects check runs and excludes its own check', () => {
  assert.match(workflow, /commits\/\$HEAD_SHA\/check-runs\?per_page=100/)
  assert.match(workflow, /gh api --paginate/)
  assert.doesNotMatch(workflow, /gh api --paginate --slurp/)
  assert.match(workflow, /OWN_CHECK_NAME: controlled auto-merge/)
  assert.match(workflow, /excluded_names: \[\$own\]/)
})


test('fails closed for forks, incomplete file inventories, and stale heads', () => {
  assert.match(workflow, /fork pull requests are never auto-merged/)
  assert.match(workflow, /Changed-file inventory is incomplete/)
  assert.match(workflow, /--match-head-commit "\$HEAD_SHA"/)
  assert.match(workflow, /moved during evaluation/)
})


test('uses squash merge and deletes only the merged pull-request branch', () => {
  assert.match(
    workflow,
    /gh pr merge "\$PR" \\\n+            --repo "\$REPOSITORY" \\\n+            --squash \\\n+            --delete-branch \\\n+            --match-head-commit "\$HEAD_SHA"/,
  )
  assert.doesNotMatch(workflow, /git push .*--delete/)
  assert.doesNotMatch(workflow, /gh (issue|pr) edit .*--add-label/)
})


test('requires an explicit label and never auto-labels', () => {
  assert.match(workflow, /github\.event\.label\.name == 'auto-merge'/)
  assert.match(workflow, /AUTO_MERGE_LABEL: auto-merge/)
  assert.doesNotMatch(workflow, /add-label|labels\/[^'" ]+$/m)
})
