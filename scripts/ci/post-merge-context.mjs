#!/usr/bin/env node

import fs from 'node:fs'

export const POST_MERGE_EVENT_TYPE = 'post-controlled-auto-merge-ci'

const GIT_OBJECT_SHA_PATTERN = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/
const STANDARD_EVENTS = new Set(['pull_request', 'push'])
const POST_MERGE_PAYLOAD_KEYS = Object.freeze([
  'merge_sha',
  'pr_number',
  'reviewed_head_sha',
])

function denial(category, detail) {
  return detail ? { category, detail } : { category }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isGitObjectSha(value) {
  return typeof value === 'string' && GIT_OBJECT_SHA_PATTERN.test(value)
}

export function evaluatePostMergeContext(input) {
  if (!isObject(input)) {
    return {
      decision: 'deny',
      checkout_ref: null,
      mode: 'invalid',
      reasons: [denial('malformed-input')],
    }
  }

  const eventName = input.event_name
  const githubSha = input.github_sha
  const reasons = []

  if (!isGitObjectSha(githubSha)) {
    reasons.push(denial('invalid-github-sha'))
  }

  if (STANDARD_EVENTS.has(eventName)) {
    return {
      decision: reasons.length === 0 ? 'allow' : 'deny',
      checkout_ref: reasons.length === 0 ? githubSha : null,
      mode: 'standard-event',
      reasons,
    }
  }

  if (eventName !== 'repository_dispatch') {
    reasons.push(denial('unsupported-event', String(eventName ?? 'missing')))
    return {
      decision: 'deny',
      checkout_ref: null,
      mode: 'invalid',
      reasons,
    }
  }

  if (input.action !== POST_MERGE_EVENT_TYPE) {
    reasons.push(denial('invalid-dispatch-action'))
  }
  if (typeof input.repository !== 'string' || !input.repository.includes('/')) {
    reasons.push(denial('invalid-repository'))
  }
  if (
    typeof input.default_branch !== 'string' ||
    input.default_branch.length === 0
  ) {
    reasons.push(denial('invalid-default-branch'))
  }

  const payload = input.client_payload
  if (!isObject(payload)) {
    reasons.push(denial('invalid-client-payload'))
  } else if (
    JSON.stringify(Object.keys(payload).sort()) !==
    JSON.stringify(POST_MERGE_PAYLOAD_KEYS)
  ) {
    reasons.push(denial('unexpected-client-payload-shape'))
  }

  const mergeSha = isObject(payload) ? payload.merge_sha : null
  const reviewedHeadSha = isObject(payload) ? payload.reviewed_head_sha : null
  const pullRequestNumber = isObject(payload) ? payload.pr_number : null

  if (!isGitObjectSha(mergeSha)) {
    reasons.push(denial('invalid-merge-sha'))
  }
  if (!isGitObjectSha(reviewedHeadSha)) {
    reasons.push(denial('invalid-reviewed-head-sha'))
  }
  if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1) {
    reasons.push(denial('invalid-pr-number'))
  }

  const pullRequest = input.pull_request
  if (!isObject(pullRequest)) {
    reasons.push(denial('invalid-pull-request'))
  } else {
    if (
      pullRequest.state !== 'closed' ||
      pullRequest.merged !== true ||
      typeof pullRequest.merged_at !== 'string' ||
      pullRequest.merged_at.length === 0
    ) {
      reasons.push(denial('pull-request-not-merged'))
    }
    if (pullRequest.number !== pullRequestNumber) {
      reasons.push(denial('pull-request-number-mismatch'))
    }
    if (pullRequest.merge_commit_sha !== mergeSha) {
      reasons.push(denial('merge-sha-mismatch'))
    }
    if (pullRequest.head?.sha !== reviewedHeadSha) {
      reasons.push(denial('reviewed-head-mismatch'))
    }
    if (pullRequest.head?.repo?.full_name !== input.repository) {
      reasons.push(denial('fork-or-repository-mismatch'))
    }
    if (pullRequest.base?.ref !== input.default_branch) {
      reasons.push(denial('base-branch-mismatch'))
    }
    if (pullRequest.base?.repo?.full_name !== input.repository) {
      reasons.push(denial('base-repository-mismatch'))
    }
  }

  if (input.merge_is_ancestor_of_event_sha !== true) {
    reasons.push(denial('merge-not-on-event-main'))
  }

  return {
    decision: reasons.length === 0 ? 'allow' : 'deny',
    checkout_ref: reasons.length === 0 ? mergeSha : null,
    mode: 'post-merge-dispatch',
    pr_number: Number.isInteger(pullRequestNumber) ? pullRequestNumber : null,
    reasons,
    reviewed_head_sha: isGitObjectSha(reviewedHeadSha) ? reviewedHeadSha : null,
  }
}

function parseCliInput(argv) {
  const inputIndex = argv.indexOf('--input')
  if (inputIndex < 0 || !argv[inputIndex + 1]) {
    throw new Error(
      'usage: post-merge-context.mjs evaluate --input <json-file>',
    )
  }
  return JSON.parse(fs.readFileSync(argv[inputIndex + 1], 'utf8'))
}

const invokedPath = process.argv[1]
  ? new URL(`file://${process.argv[1]}`).href
  : ''
if (import.meta.url === invokedPath) {
  try {
    if (process.argv[2] !== 'evaluate') {
      throw new Error(`unsupported command: ${process.argv[2] ?? '<missing>'}`)
    }
    const result = evaluatePostMergeContext(
      parseCliInput(process.argv.slice(3)),
    )
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 2
  }
}
