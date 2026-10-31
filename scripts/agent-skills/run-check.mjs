#!/usr/bin/env node

import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { runDeterministicCheck } from './receipts.mjs'

export function parseCheckArgs(args) {
  if (
    args.length !== 1 ||
    args[0].trim() !== args[0] ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args[0])
  ) {
    throw new Error('usage: run-check.mjs <registered-check-id> (coordinator host only)')
  }
  return args[0]
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const outcome = runDeterministicCheck(parseCheckArgs(process.argv.slice(2)))
    console.log(JSON.stringify(outcome, null, 2))
    process.exitCode = outcome.receipt.exitCode
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
