# Task 61 Implement project-wide evidence-authorized autonomous delivery - Findings

## Purpose
Record discoveries, gaps, risks, failed assumptions, and evidence-backed observations for Task 61.

## Findings
- 2026-07-11 - The mandatory label and broad path classifier made ordinary package, framework-config, and domain-skill work attended even after protected checks passed.
- 2026-07-11 - The existing unit/browser CI steps are explicit unsupported-capability bridges, so they cannot honestly authorize unattended behavior-changing merges.
- 2026-07-11 - Trusted-main policy can authorize ordinary PRs without executing PR code by inspecting only GitHub metadata, check runs, inert package JSON, and a protected capability contract.
- 2026-07-11 - Rename classification must inspect both `filename` and `previous_filename`; destination-only classification could disguise removal of a protected workflow or test as a harmless rename. The final policy fails closed when rename provenance is absent.

## Progress Log
- **2026-07-11 00:05 CEST** - [S:20260711|W:task61-domain-skill-auto-merge|H:aegis:kickoff|E:.aegis/state/current-work.json] Findings log initialized by Aegis kickoff.
- **2026-07-11 00:06 CEST** - [S:20260711|W:task61-domain-skill-auto-merge|H:agent:scope|E:docs/ai/work-tracking/active/20260711-task61-domain-skill-auto-merge-ACTIVE/FINDINGS.md] Confirmed scope: permit controlled auto-merge for registered domain-skill paths and authorize the label while preserving all non-skill authority protections.
