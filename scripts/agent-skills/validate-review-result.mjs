#!/usr/bin/env node

import fs from "node:fs";

import { validateReviewResult } from "./lib.mjs";

const [resultPath] = process.argv.slice(2);
if (!resultPath) {
  console.error(
    "usage: validate-review-result.mjs <reports/agent-skills/result.json>",
  );
  process.exit(2);
}

let result;
try {
  result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const errors = validateReviewResult(result);
console.log(JSON.stringify({ passed: errors.length === 0, errors }, null, 2));
if (errors.length > 0) process.exitCode = 1;
