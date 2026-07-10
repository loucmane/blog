#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { buildAegisIngestCommand } from "./lib.mjs";

const arguments_ = process.argv.slice(2);
const dryRun = arguments_.includes("--dry-run");
const resultPath = arguments_.find((argument) => argument !== "--dry-run");
if (!resultPath) {
  console.error(
    "usage: ingest-result.mjs <reports/agent-skills/result.json> [--dry-run]",
  );
  process.exit(2);
}

let invocation;
try {
  invocation = buildAegisIngestCommand({ resultPath });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (dryRun) {
  console.log(JSON.stringify(invocation, null, 2));
} else {
  const result = spawnSync(invocation.command, invocation.args, {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
