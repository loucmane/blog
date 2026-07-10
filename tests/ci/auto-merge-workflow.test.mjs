import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'


const workflowPath = new URL('../../.github/workflows/auto-merge.yml', import.meta.url)
const workflow = fs.readFileSync(workflowPath, 'utf8')


test('handles both CI-completion and label-ordering races', () => {
  assert.match(workflow, /^  workflow_run:\n    workflows: \[CI\]\n    types: \[completed\]$/m)
  assert.match(workflow, /^  pull_request_target:\n    types: \[labeled\]$/m)
  assert.doesNotMatch(workflow, /^  pull_request:/m)
  assert.match(workflow, /github\.event_name == 'pull_request_target'/)
  assert.doesNotMatch(workflow, /github\.event_name == 'pull_request'/)
  assert.match(workflow, /workflow_run\.pull_requests/)
  assert.match(workflow, /-f head="\$REPOSITORY_OWNER:\$WORKFLOW_HEAD_BRANCH"/)
})


test('grants write access only to contents and pull requests in the merge job', () => {
  assert.match(workflow, /^permissions: \{\}$/m)
  const jobPermissions = workflow.match(/^    permissions:\n((?:      [a-z-]+: [a-z]+\n?)+)/m)
  assert.equal(jobPermissions?.[1].trim(), 'contents: write\n      pull-requests: write')
  assert.doesNotMatch(workflow, /secrets\./)
})


test('executes trusted default-branch policy instead of pull-request code', () => {
  assert.equal(workflow.match(/uses: actions\/checkout@/g)?.length, 1)
  assert.match(workflow, /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/)
  assert.match(workflow, /path: trusted/)
  assert.match(workflow, /persist-credentials: false/)
  assert.match(workflow, /node trusted\/scripts\/ci\/auto-merge-policy\.mjs classify/)
  assert.match(workflow, /node trusted\/scripts\/ci\/auto-merge-policy\.mjs checks/)
})


test('never checks out or fetches a pull-request head or merge ref', () => {
  assert.doesNotMatch(workflow, /ref:\s*\$\{\{\s*github\.event\.pull_request\.head/)
  assert.doesNotMatch(workflow, /repository:\s*\$\{\{\s*github\.event\.pull_request\.head/)
  assert.doesNotMatch(workflow, /refs\/pull\//)
  assert.doesNotMatch(workflow, /gh pr checkout/)
  assert.doesNotMatch(workflow, /git fetch/)
})


test('never downloads pull-request artifacts into the privileged job', () => {
  assert.doesNotMatch(workflow, /actions\/download-artifact@/)
  assert.doesNotMatch(workflow, /gh run download/)
  assert.doesNotMatch(workflow, /artifact_url|archive_download_url/)
  assert.doesNotMatch(workflow, /\/actions\/artifacts|\/artifacts(?:[/?"])/)
  assert.doesNotMatch(workflow, /^\s+(?:curl|wget)\b/m)
})


test('executes no pull-request-controlled package or script surface', () => {
  assert.doesNotMatch(workflow, /^\s+(?:pnpm|npm|npx|yarn|bun|make|cargo|go|pytest|mvn|gradle)\b/m)
  assert.doesNotMatch(workflow, /^\s+(?:bash|sh|python|python3|ruby|perl|deno)\s+\S+/m)
  assert.doesNotMatch(workflow, /^\s+(?:eval|source|\.)\s+/m)
  assert.doesNotMatch(workflow, /repos\/\$REPOSITORY\/(?:contents|git\/blobs|tarball|zipball)/)

  const nodeScripts = [...workflow.matchAll(/\bnode ([^\s)]+)/g)].map((match) => match[1])
  assert.deepEqual(nodeScripts, [
    'trusted/scripts/ci/auto-merge-policy.mjs',
    'trusted/scripts/ci/auto-merge-policy.mjs',
  ])
})


test('fails closed unless the privileged trigger and API identifiers are valid', () => {
  assert.match(workflow, /elif \[ "\$TRIGGER" = "pull_request_target" \]; then/)
  assert.match(workflow, /Unsupported privileged trigger/)
  assert.match(workflow, /\^\[1-9\]\[0-9\]\*\$/)
  assert.match(workflow, /\^\[0-9a-f\]\{40,64\}\$/)
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
