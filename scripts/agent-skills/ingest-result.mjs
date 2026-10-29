#!/usr/bin/env node

import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { ingestReviewResult } from './lib.mjs'

export const usage =
  'usage: ingest-result.mjs <reports/agent-skills/result.json> --bead <id> [--worklog <docs/worklog/path.md>] [--city <absolute-path>] [--rig <name>] [--execute | --dry-run]'

export function parseIngestionArgs(args) {
  const options = {}
  const seen = new Set()
  for (let index = 0; index < args.length; index++) {
    const argument = args[index]
    if (argument.startsWith('--')) {
      if (seen.has(argument)) throw new Error(`Duplicate option: ${argument}`)
      seen.add(argument)
      if (argument === '--execute' || argument === '--dry-run') {
        if (options.execute !== undefined)
          throw new Error('--execute and --dry-run cannot be combined')
        options.execute = argument === '--execute'
      } else if (['--bead', '--worklog', '--city', '--rig'].includes(argument)) {
        const value = args[++index]
        if (!value || value.startsWith('-')) throw new Error(`${argument} requires a value`)
        options[argument.slice(2)] = value
      } else {
        throw new Error(`Unknown option: ${argument}`)
      }
    } else if (argument.startsWith('-') || options.resultPath !== undefined) {
      throw new Error(`Unexpected argument: ${argument}`)
    } else {
      options.resultPath = argument
    }
  }
  if (!options.resultPath || !options.bead) throw new Error(usage)
  return options
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    console.log(
      JSON.stringify(ingestReviewResult(parseIngestionArgs(process.argv.slice(2))), null, 2),
    )
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
