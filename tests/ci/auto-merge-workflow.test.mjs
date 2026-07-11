import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import test from 'node:test'

import {
  POST_MERGE_EVENT_TYPE,
  evaluatePostMergeContext,
} from '../../scripts/ci/post-merge-context.mjs'

const workflowPath = new URL(
  '../../.github/workflows/auto-merge.yml',
  import.meta.url,
)
const workflow = fs.readFileSync(workflowPath, 'utf8')
const ciWorkflow = fs.readFileSync(
  new URL('../../.github/workflows/ci.yml', import.meta.url),
  'utf8',
)
const policy = fs.readFileSync(
  new URL('../../scripts/ci/auto-merge-policy.mjs', import.meta.url),
  'utf8',
)
const secretScanJob = ciWorkflow.match(
  /^  secret-scan:\n[\s\S]*?(?=^  dependency-review:)/m,
)?.[0]

assert.ok(secretScanJob)

function extractRunBlock(job, stepName) {
  const stepMarker = `      - name: ${stepName}\n`
  const stepStart = job.indexOf(stepMarker)
  assert.ok(stepStart >= 0, `missing workflow step: ${stepName}`)

  const runMarker = '        run: |\n'
  const runStart = job.indexOf(runMarker, stepStart)
  assert.ok(runStart >= 0, `missing run block: ${stepName}`)

  const rawBlock = job.slice(runStart + runMarker.length)
  const nextStep = rawBlock.search(/^      - name: /m)
  const block = nextStep >= 0 ? rawBlock.slice(0, nextStep) : rawBlock

  return block
    .split('\n')
    .map((line) => (line.startsWith('          ') ? line.slice(10) : line))
    .join('\n')
}

const gitleaksEnforcementScript = extractRunBlock(
  secretScanJob,
  'Enforce event-specific Gitleaks execution',
)

test('handles CI completion and pull-request eligibility state changes', () => {
  assert.match(
    workflow,
    /^  workflow_run:\n    workflows: \[CI\]\n    types: \[completed\]$/m,
  )
  assert.match(
    workflow,
    /^  pull_request_target:\n    types: \[labeled, unlabeled, ready_for_review, reopened\]$/m,
  )
  assert.doesNotMatch(workflow, /^  pull_request:/m)
  assert.match(workflow, /github\.event_name == 'pull_request_target'/)
  assert.doesNotMatch(workflow, /github\.event_name == 'pull_request'/)
  assert.match(workflow, /workflow_run\.pull_requests/)
  assert.match(workflow, /-f head="\$REPOSITORY_OWNER:\$WORKFLOW_HEAD_BRANCH"/)
})

test('grants write access only to contents and pull requests in the merge job', () => {
  assert.match(workflow, /^permissions: \{\}$/m)
  const jobPermissions = workflow.match(
    /^    permissions:\n((?:      [a-z-]+: [a-z]+\n?)+)/m,
  )
  assert.equal(
    jobPermissions?.[1].trim(),
    'contents: write\n      pull-requests: write',
  )
  assert.doesNotMatch(workflow, /secrets\./)
})

test('executes trusted default-branch policy instead of pull-request code', () => {
  assert.equal(workflow.match(/uses: actions\/checkout@/g)?.length, 1)
  assert.match(
    workflow,
    /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/,
  )
  assert.match(workflow, /path: trusted/)
  assert.match(workflow, /persist-credentials: false/)
  assert.match(
    workflow,
    /node trusted\/scripts\/ci\/auto-merge-policy\.mjs classify/,
  )
  assert.match(
    workflow,
    /node trusted\/scripts\/ci\/auto-merge-policy\.mjs checks/,
  )
  assert.match(
    workflow,
    /node trusted\/scripts\/ci\/auto-merge-policy\.mjs manifests/,
  )
  assert.match(
    workflow,
    /node trusted\/scripts\/ci\/auto-merge-policy\.mjs aegis-manifest/,
  )
  assert.match(
    workflow,
    /node trusted\/scripts\/ci\/auto-merge-policy\.mjs aegis-manifest-object/,
  )
})

test('never checks out or fetches a pull-request head or merge ref', () => {
  assert.doesNotMatch(
    workflow,
    /ref:\s*\$\{\{\s*github\.event\.pull_request\.head/,
  )
  assert.doesNotMatch(
    workflow,
    /repository:\s*\$\{\{\s*github\.event\.pull_request\.head/,
  )
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
  assert.doesNotMatch(
    workflow,
    /^\s+(?:pnpm|npm|npx|yarn|bun|make|cargo|go|pytest|mvn|gradle)\b/m,
  )
  assert.doesNotMatch(
    workflow,
    /^\s+(?:bash|sh|python|python3|ruby|perl|deno)\s+\S+/m,
  )
  assert.doesNotMatch(workflow, /^\s+(?:eval|source|\.)\s+/m)
  assert.doesNotMatch(
    workflow,
    /repos\/\$REPOSITORY\/(?:tarball|zipball)/,
  )
  assert.match(
    workflow,
    /repos\/\$REPOSITORY\/contents\/\$PACKAGE_PATH\?ref=\$HEAD_SHA/,
  )
  assert.match(workflow, /jq -e 'type == "object"' "\$HEAD_MANIFEST"/)
  assert.match(
    workflow,
    /repos\/\$REPOSITORY\/git\/commits\/\$commit_sha/,
  )
  assert.match(
    workflow,
    /repos\/\$REPOSITORY\/git\/trees\/\$root_tree_sha/,
  )
  assert.match(
    workflow,
    /repos\/\$REPOSITORY\/git\/trees\/\$root_entry_sha/,
  )
  assert.match(
    workflow,
    /repos\/\$REPOSITORY\/git\/blobs\/\$blob_sha/,
  )
  assert.match(
    workflow,
    /--slurpfile base "\$BASE_AEGIS_MANIFEST"/,
  )
  assert.match(
    workflow,
    /--slurpfile head "\$HEAD_AEGIS_MANIFEST"/,
  )
  assert.doesNotMatch(
    workflow,
    /repos\/\$REPOSITORY\/contents\/\$AEGIS_MANIFEST_PATH/,
  )
  assert.equal(
    workflow.match(/--argjson aegis_manifest_object "\$AEGIS_MANIFEST_OBJECT_RESULT"/g)
      ?.length,
    2,
  )
  assert.equal(
    workflow.match(
      /--argjson aegis_manifest_verification "\$AEGIS_MANIFEST_RESULT"/g,
    )?.length,
    2,
  )
  assert.equal(
    workflow.match(/file_inventory_complete: true/g)?.length,
    2,
  )

  const nodeScripts = [...workflow.matchAll(/\bnode ([^\s)]+)/g)].map(
    (match) => match[1],
  )
  assert.deepEqual(nodeScripts, [
    'trusted/scripts/ci/auto-merge-policy.mjs',
    'trusted/scripts/ci/auto-merge-policy.mjs',
    'trusted/scripts/ci/auto-merge-policy.mjs',
    'trusted/scripts/ci/auto-merge-policy.mjs',
    'trusted/scripts/ci/auto-merge-policy.mjs',
    'trusted/scripts/ci/auto-merge-policy.mjs',
    'trusted/scripts/ci/auto-merge-policy.mjs',
  ])
})

test('allows only trusted semantic verification of the Aegis manifest timestamp', () => {
  assert.match(
    workflow,
    /AEGIS_MANIFEST_PATH='\.aegis\/foundation-manifest\.json'/,
  )
  assert.match(workflow, /AEGIS_MANIFEST_STATUS.*\.status/)
  assert.match(workflow, /AEGIS_MANIFEST_STATUS" != "modified"/)
  assert.match(
    workflow,
    /changed beyond verification\.last_verified_at; attended review is required/,
  )
  assert.doesNotMatch(workflow, /trusted\/\.aegis\/(?:state|reports|capsule)/)
})

test('proves a unique regular manifest blob before semantic allowance', () => {
  assert.match(workflow, /collect_manifest_tree_evidence base/)
  assert.match(workflow, /collect_manifest_tree_evidence head/)
  assert.match(workflow, /root_entry_count.*\.aegis/)
  assert.match(workflow, /manifest_entry_count.*foundation-manifest\.json/)
  assert.match(workflow, /root_truncated/)
  assert.match(workflow, /manifest_truncated/)
  assert.match(workflow, /root_entry_type" = "tree"/)
  assert.match(workflow, /root_entry_mode" = "040000"/)
  assert.match(workflow, /state == "regular-blob"/)
  assert.match(workflow, /not a unique regular 100644 Git blob/)
  assert.match(workflow, /\.sha == \$sha and \.encoding == "base64"/)
  assert.match(workflow, /Decoded \$revision manifest blob size mismatch/)
  assert.doesNotMatch(workflow, /git\/trees\/[^\s"']+\?recursive/)

  const objectCheck = workflow.indexOf('aegis-manifest-object --input')
  const blobFetch = workflow.indexOf('fetch_verified_manifest_blob base')
  const semanticCheck = workflow.indexOf('aegis-manifest --input')
  assert.ok(objectCheck >= 0)
  assert.ok(blobFetch > objectCheck)
  assert.ok(semanticCheck > blobFetch)
})

test('binds timestamp evaluation to trusted CLI runner time with five-minute skew', () => {
  assert.match(
    policy,
    /AEGIS_MANIFEST_MAX_FUTURE_SKEW_SECONDS = 5 \* 60/,
  )
  assert.match(
    policy,
    /trustedEvaluationTime: new Date\(\)\.toISOString\(\)/,
  )
  assert.doesNotMatch(workflow, /trusted_evaluation_time.*\$PR/)
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
  assert.match(workflow, /Final changed-file inventory is incomplete/)
  assert.match(
    workflow,
    /FETCHED_FILE_COUNT" -ne "\$DECLARED_FILE_COUNT/,
  )
  assert.match(
    workflow,
    /CURRENT_FETCHED_FILE_COUNT" -ne "\$CURRENT_DECLARED_FILE_COUNT/,
  )
  assert.match(workflow, /not CLEAN and mergeable/)
  assert.match(workflow, /became ineligible during final policy revalidation/)
  assert.match(workflow, /Required checks changed during final evaluation/)
  assert.match(workflow, /reviewThreads\(first:100\)/)
  assert.match(workflow, /has unresolved review threads/)
  assert.match(workflow, /active changes-requested review/)
})

test('includes rename provenance in both initial and final inventories', () => {
  assert.equal(
    workflow.split(
      '{filename, previous_filename, status, additions, deletions, changes}',
    ).length - 1,
    2,
  )
})

test('uses squash merge and deletes only the merged pull-request branch', () => {
  assert.match(
    workflow,
    /gh pr merge "\$PR" \\\n+            --repo "\$REPOSITORY" \\\n+            --squash \\\n+            --delete-branch \\\n+            --match-head-commit "\$HEAD_SHA"/,
  )
  assert.doesNotMatch(workflow, /git push .*--delete/)
  assert.doesNotMatch(workflow, /gh (issue|pr) edit .*--add-label/)
})

test('does not require or add an auto-merge label', () => {
  assert.doesNotMatch(workflow, /github\.event\.label\.name == 'auto-merge'/)
  assert.doesNotMatch(workflow, /AUTO_MERGE_LABEL/)
  assert.doesNotMatch(workflow, /add-label|labels\/[^'" ]+$/m)
})

test('dispatches exact-commit CI only after a verified squash merge', () => {
  const mergeIndex = workflow.indexOf('gh pr merge "$PR"')
  const dispatchIndex = workflow.indexOf('"repos/$REPOSITORY/dispatches"')

  assert.ok(mergeIndex >= 0)
  assert.ok(dispatchIndex > mergeIndex)
  assert.match(workflow, /POST_MERGE_PR_JSON=/)
  assert.match(workflow, /\.merged \/\/ false/)
  assert.match(workflow, /\.merge_commit_sha \/\/ ""/)
  assert.match(workflow, /MERGED_HEAD_SHA" != "\$HEAD_SHA"/)
  assert.match(workflow, /MERGED_HEAD_REPOSITORY" != "\$REPOSITORY"/)
  assert.match(workflow, /MERGED_BASE_BRANCH" != "\$DEFAULT_BRANCH"/)
  assert.match(workflow, /compare\/\$MERGE_SHA\.\.\.\$DEFAULT_BRANCH_SHA/)
  assert.match(workflow, /COMPARE_STATUS" != "identical"/)
  assert.match(workflow, /COMPARE_STATUS" != "ahead"/)
  assert.match(workflow, /event_type: \$event_type/)
  assert.match(workflow, /merge_sha: \$merge_sha/)
  assert.match(workflow, /pr_number: \$pr_number/)
  assert.match(workflow, /reviewed_head_sha: \$reviewed_head_sha/)
  assert.match(workflow, /post-controlled-auto-merge-ci/)
  assert.doesNotMatch(workflow, /workflow_dispatch/)
  assert.doesNotMatch(workflow, /actions: write/)
})

test('runs repository-dispatched CI from trusted main before exact commit checkout', () => {
  assert.match(
    ciWorkflow,
    /^  repository_dispatch:\n    types: \[post-controlled-auto-merge-ci\]$/m,
  )
  assert.match(
    ciWorkflow,
    /^  context:\n    name: context · resolve trusted verification commit$/m,
  )
  assert.match(
    ciWorkflow,
    /group: ci-\$\{\{ github\.workflow \}\}-\$\{\{ github\.event_name == 'repository_dispatch' && github\.run_id \|\| github\.ref \}\}/,
  )
  assert.match(ciWorkflow, /permissions:\n      contents: read/)
  assert.match(ciWorkflow, /ref: \$\{\{ github\.sha \}\}/)
  assert.match(ciWorkflow, /repos\/\$REPOSITORY\/pulls\/\$CLIENT_PR_NUMBER/)
  assert.match(
    ciWorkflow,
    /git cat-file -e "\$\{CLIENT_MERGE_SHA\}\^\{commit\}"/,
  )
  assert.match(
    ciWorkflow,
    /git merge-base --is-ancestor "\$CLIENT_MERGE_SHA" "\$EVENT_SHA"/,
  )
  assert.match(
    ciWorkflow,
    /node scripts\/ci\/post-merge-context\.mjs evaluate --input "\$CONTEXT_INPUT"/,
  )
  assert.equal(ciWorkflow.match(/^    needs: context$/gm)?.length, 4)
  assert.equal(
    ciWorkflow.match(/ref: \$\{\{ needs\.context\.outputs\.checkout_ref \}\}/g)
      ?.length,
    4,
  )
  assert.doesNotMatch(ciWorkflow, /secrets\./)

  const trustedCheckout = ciWorkflow.indexOf('ref: ${{ github.sha }}')
  const payloadEvaluation = ciWorkflow.indexOf(
    'node scripts/ci/post-merge-context.mjs evaluate',
  )
  const exactCommitCheckout = ciWorkflow.indexOf(
    'ref: ${{ needs.context.outputs.checkout_ref }}',
  )
  assert.ok(trustedCheckout >= 0)
  assert.ok(payloadEvaluation > trustedCheckout)
  assert.ok(exactCommitCheckout > payloadEvaluation)
})

test('keeps the pinned Gitleaks action for push and pull-request events', () => {
  assert.equal(
    secretScanJob.match(/uses: gitleaks\/gitleaks-action@/g)?.length,
    1,
  )
  assert.match(
    secretScanJob,
    /if: github\.event_name == 'push' \|\| github\.event_name == 'pull_request'\n        uses: gitleaks\/gitleaks-action@e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e/,
  )
  assert.match(secretScanJob, /GITLEAKS_ENABLE_COMMENTS: "false"/)
  assert.match(secretScanJob, /GITLEAKS_ENABLE_UPLOAD_ARTIFACT: "false"/)
})

test('uses a checksum-pinned official Gitleaks CLI for repository dispatch', () => {
  assert.match(
    secretScanJob,
    /GITLEAKS_VERSION: 8\.30\.1/,
  )
  assert.match(
    secretScanJob,
    /GITLEAKS_ARCHIVE_SHA256: 551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb/,
  )
  assert.match(
    secretScanJob,
    /https:\/\/github\.com\/gitleaks\/gitleaks\/releases\/download\/v\$\{GITLEAKS_VERSION\}\/gitleaks_\$\{GITLEAKS_VERSION\}_linux_x64\.tar\.gz/,
  )
  assert.match(secretScanJob, /sha256sum --check --status/)
  assert.match(secretScanJob, /tar -xzf "\$archive" -C "\$extract_dir" gitleaks/)
  assert.doesNotMatch(secretScanJob, /releases\/latest/)
  assert.doesNotMatch(secretScanJob, /curl[^\n]*\|\s*(?:bash|sh)/)
  assert.doesNotMatch(secretScanJob, /actions\/download-artifact@/)
})

test('binds the dispatch CLI scan to the trusted exact commit and full history', () => {
  assert.match(secretScanJob, /^    needs: context$/m)
  assert.match(
    secretScanJob,
    /ref: \$\{\{ needs\.context\.outputs\.checkout_ref \}\}/,
  )
  assert.match(
    secretScanJob,
    /TRUSTED_CHECKOUT_REF: \$\{\{ needs\.context\.outputs\.checkout_ref \}\}/,
  )
  assert.match(secretScanJob, /actual_ref=\$\(git rev-parse HEAD\)/)
  assert.match(secretScanJob, /"\$actual_ref" != "\$TRUSTED_CHECKOUT_REF"/)
  assert.match(secretScanJob, /gitleaks git \\/)
  assert.match(
    secretScanJob,
    /--gitleaks-ignore-path "\$GITHUB_WORKSPACE\/\.gitleaksignore" \\/,
  )
  assert.match(secretScanJob, /--log-opts="--all" \\/)
  assert.match(secretScanJob, /"\$GITHUB_WORKSPACE"/)
  assert.doesNotMatch(secretScanJob, /--config/)
})

test('fails closed unless the event-specific Gitleaks path completes', () => {
  assert.match(
    secretScanJob,
    /id: action_scan\n        if: github\.event_name == 'push' \|\| github\.event_name == 'pull_request'/,
  )
  assert.match(
    secretScanJob,
    /id: dispatch_cli\n        if: github\.event_name == 'repository_dispatch'/,
  )
  assert.match(
    secretScanJob,
    /id: dispatch_scan\n        if: github\.event_name == 'repository_dispatch'/,
  )
  assert.match(secretScanJob, /ACTION_SCAN: \$\{\{ steps\.action_scan\.outcome \}\}/)
  assert.match(secretScanJob, /DISPATCH_CLI: \$\{\{ steps\.dispatch_cli\.outcome \}\}/)
  assert.match(secretScanJob, /DISPATCH_SCAN: \$\{\{ steps\.dispatch_scan\.outcome \}\}/)
  assert.match(secretScanJob, /push\|pull_request\)/)
  assert.match(secretScanJob, /repository_dispatch\)/)
  assert.match(secretScanJob, /No Gitleaks execution contract exists for event/)
  assert.doesNotMatch(secretScanJob, /continue-on-error:/)
  assert.doesNotMatch(secretScanJob, /^    if: always\(\)$/m)
})

test('executes the event-path outcome contract and denies skipped scanners', async (t) => {
  const runContract = (eventName, outcomes) =>
    spawnSync('bash', ['-c', gitleaksEnforcementScript], {
      encoding: 'utf8',
      env: {
        ...process.env,
        ACTION_SCAN: outcomes.action,
        DISPATCH_CLI: outcomes.cli,
        DISPATCH_SCAN: outcomes.scan,
        EVENT_NAME: eventName,
      },
    })

  const allowed = [
    ['push', { action: 'success', cli: 'skipped', scan: 'skipped' }],
    ['pull_request', { action: 'success', cli: 'skipped', scan: 'skipped' }],
    ['repository_dispatch', { action: 'skipped', cli: 'success', scan: 'success' }],
  ]
  for (const [eventName, outcomes] of allowed) {
    await t.test(`allows ${eventName} expected outcomes`, () => {
      assert.equal(runContract(eventName, outcomes).status, 0)
    })
  }

  const denied = [
    ['push scanner skipped', 'push', { action: 'skipped', cli: 'skipped', scan: 'skipped' }],
    ['pull-request scanner failed', 'pull_request', { action: 'failure', cli: 'skipped', scan: 'skipped' }],
    ['dispatch installer skipped', 'repository_dispatch', { action: 'skipped', cli: 'skipped', scan: 'skipped' }],
    ['dispatch scanner skipped', 'repository_dispatch', { action: 'skipped', cli: 'success', scan: 'skipped' }],
    ['dispatch action unexpectedly ran', 'repository_dispatch', { action: 'success', cli: 'success', scan: 'success' }],
    ['unknown event', 'workflow_dispatch', { action: 'skipped', cli: 'skipped', scan: 'skipped' }],
  ]
  for (const [name, eventName, outcomes] of denied) {
    await t.test(`denies ${name}`, () => {
      assert.notEqual(runContract(eventName, outcomes).status, 0)
    })
  }
})

function validPostMergeInput() {
  const mergeSha = 'a'.repeat(40)
  const reviewedHeadSha = 'b'.repeat(40)

  return {
    action: POST_MERGE_EVENT_TYPE,
    client_payload: {
      merge_sha: mergeSha,
      pr_number: 25,
      reviewed_head_sha: reviewedHeadSha,
    },
    default_branch: 'main',
    event_name: 'repository_dispatch',
    github_sha: 'c'.repeat(40),
    merge_is_ancestor_of_event_sha: true,
    pull_request: {
      base: {
        ref: 'main',
        repo: { full_name: 'loucmane/blog' },
      },
      head: {
        repo: { full_name: 'loucmane/blog' },
        sha: reviewedHeadSha,
      },
      merge_commit_sha: mergeSha,
      merged: true,
      merged_at: '2026-07-11T14:39:00Z',
      number: 25,
      state: 'closed',
    },
    repository: 'loucmane/blog',
  }
}

test('allows standard CI events and the verified post-merge dispatch', () => {
  for (const eventName of ['push', 'pull_request']) {
    const result = evaluatePostMergeContext({
      event_name: eventName,
      github_sha: 'd'.repeat(40),
    })
    assert.equal(result.decision, 'allow')
    assert.equal(result.mode, 'standard-event')
  }

  const result = evaluatePostMergeContext(validPostMergeInput())
  assert.equal(result.decision, 'allow')
  assert.equal(result.mode, 'post-merge-dispatch')
  assert.equal(result.checkout_ref, 'a'.repeat(40))
  assert.deepEqual(result.reasons, [])
})

test('fails closed for malformed and unsupported CI context', () => {
  assert.equal(evaluatePostMergeContext(null).decision, 'deny')
  assert.equal(
    evaluatePostMergeContext({
      event_name: 'workflow_dispatch',
      github_sha: 'd'.repeat(40),
    }).decision,
    'deny',
  )
  assert.equal(
    evaluatePostMergeContext({ event_name: 'push', github_sha: 'invalid' })
      .decision,
    'deny',
  )
})

test('denies adversarial post-merge dispatch evidence', async (t) => {
  const cases = [
    [
      'wrong dispatch action',
      (input) => {
        input.action = 'untrusted-event'
      },
      'invalid-dispatch-action',
    ],
    [
      'missing payload',
      (input) => {
        delete input.client_payload
      },
      'invalid-client-payload',
    ],
    [
      'malformed merge sha',
      (input) => {
        input.client_payload.merge_sha = 'not-a-sha'
      },
      'invalid-merge-sha',
    ],
    [
      'extra payload field',
      (input) => {
        input.client_payload.untrusted = true
      },
      'unexpected-client-payload-shape',
    ],
    [
      'invalid pull request number',
      (input) => {
        input.client_payload.pr_number = 0
      },
      'invalid-pr-number',
    ],
    [
      'unmerged pull request',
      (input) => {
        input.pull_request.merged = false
      },
      'pull-request-not-merged',
    ],
    [
      'different merge commit',
      (input) => {
        input.pull_request.merge_commit_sha = 'e'.repeat(40)
      },
      'merge-sha-mismatch',
    ],
    [
      'moved reviewed head',
      (input) => {
        input.pull_request.head.sha = 'f'.repeat(40)
      },
      'reviewed-head-mismatch',
    ],
    [
      'fork repository',
      (input) => {
        input.pull_request.head.repo.full_name = 'attacker/fork'
      },
      'fork-or-repository-mismatch',
    ],
    [
      'wrong base branch',
      (input) => {
        input.pull_request.base.ref = 'release'
      },
      'base-branch-mismatch',
    ],
    [
      'wrong base repository',
      (input) => {
        input.pull_request.base.repo.full_name = 'attacker/fork'
      },
      'base-repository-mismatch',
    ],
    [
      'merge absent from event main',
      (input) => {
        input.merge_is_ancestor_of_event_sha = false
      },
      'merge-not-on-event-main',
    ],
  ]

  for (const [name, mutate, expectedCategory] of cases) {
    await t.test(name, () => {
      const input = validPostMergeInput()
      mutate(input)
      const result = evaluatePostMergeContext(input)
      assert.equal(result.decision, 'deny')
      assert.equal(result.checkout_ref, null)
      assert.ok(
        result.reasons.some((reason) => reason.category === expectedCategory),
      )
    })
  }
})
