#!/usr/bin/env node

import { validatePlatform } from "./lib.mjs";

const report = validatePlatform();
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
