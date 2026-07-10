# Cross-Agent Skill System V1 Roadmap

**Status:** Planned; implementation requires separate task PRs

**Updated:** 2026-07-10

## Purpose

Define the complete v1 skill system for designing, building, reviewing, and delivering the
owner-operated magazine. This document reconciles Taskmaster only; it does not add skill
bodies, registrations, routes, symlinks, product code, packages, or framework changes.

## Platform Contract

Task 49 established the shared platform:

- `.claude/skills/` is the canonical project skill root;
- `.agents/skills/` contains repository-relative Codex symlinks;
- `config/agent-skills/catalog.yaml` registers implemented skills;
- `config/agent-skills/review-map.yaml` owns routing;
- structured results follow `schemas/agent-skills/review-result.schema.json`;
- generated evidence remains under ignored `reports/agent-skills/` and enters Aegis only
  through supported ingestion;
- subjective findings remain advisory; only deterministic findings are blocking-eligible.

Task 56 established current advisory Aegis governance. Task 57 is the planning prerequisite
for all v1 domain work.

## V1 Skill Inventory

| Task | Skill capability | State after Task 57 |
| --- | --- | --- |
| 50 | Magazine Product Discovery | preserved; first domain input |
| 51 | Stack Research and ADR | preserved; first domain input |
| 52 | Owner Publishing UX | preserved; first domain input |
| 58 | Content Platform and Backend | newly planned independent skill |
| 59 | Security, Identity, and Privacy | newly planned independent skill |
| 53 | Frontend and Editorial | preserved |
| 54 | SEO and Release Witness | preserved |
| 60 | Quality, Reliability, and Observability | newly planned independent skill |
| 55 | Routing, forward evaluation, and five-PR dogfood | preserved and strengthened final gate |

## Dependency Graph

| Task | Direct dependencies |
| --- | --- |
| 57 | 49, 56 |
| 50 | 49, 56, 57 |
| 51 | 49, 56, 57 |
| 52 | 49, 56, 57 |
| 58 | 50, 51, 52 |
| 53 | 50, 51, 52, 58 |
| 59 | 51, 52, 58 |
| 54 | 50, 51, 53, 58, 59 |
| 60 | 51, 52, 53, 54, 58, 59 |
| 55 | 50, 51, 52, 53, 54, 58, 59, 60 |

Task 55 directly depends on every v1 domain skill even when dependencies are also
transitive. This makes the final integration gate mechanically explicit.

## Task 58 — Content Platform and Backend

The skill must cover:

- editorial content domain model;
- draft, revision, publish, unpublish, and scheduling state machines;
- APIs and server boundaries;
- database schema and reversible migrations;
- media storage, processing, ownership, and failure handling;
- background jobs and scheduling;
- search indexing;
- portable import and export;
- backup and recovery;
- data-integrity and failure-path review.

## Task 59 — Security, Identity, and Privacy

The skill must cover:

- owner authentication and account recovery;
- authorization and future role boundaries;
- session, credential, and secret handling;
- rich-content sanitization;
- upload and media security;
- abuse and rate-limit controls;
- privacy and data-retention review;
- dependency and supply-chain risk;
- a lightweight structured threat model.

## Task 60 — Quality, Reliability, and Observability

The skill must cover:

- unit, integration, contract, and browser test strategy;
- owner publishing acceptance journeys;
- accessibility automation and manual review;
- performance budgets and Core Web Vitals;
- structured logging and error reporting;
- health and readiness checks;
- production verification;
- backup and restore drills;
- incident and rollback readiness.

## Task 55 Acceptance Contract

Task 55 is complete only when:

1. Deterministic routing tests cover every registered v1 skill.
2. Explicit positive, negative, and ambiguous trigger fixtures exercise intended routing and
   deny paths.
3. Forward evaluation withholds expected answers from the reviewing agent.
4. Five real task-scoped PRs span materially different skill combinations.
5. Published metrics include false positives, false negatives, missed routing, and unusable
   advice.
6. Subjective findings remain non-blocking throughout v1 dogfood.
7. Only deterministic schema, link, script, test, build, typecheck, lint, security,
   accessibility, performance-budget, health, and critical browser checks are
   blocking-eligible.
8. Every registered skill has documented promotion, revision, and retirement criteria.

## V1 Completion Definition

V1 is complete only when:

- all registered skills are implemented under `.claude/skills/` and linked relatively under
  `.agents/skills/` for Codex;
- the catalog and routing map validate deterministically;
- structured outputs are accepted by the review-result ingestion contract;
- five-PR dogfood is complete;
- measured routing and review results are published;
- no skill is promoted to blocking based only on subjective judgment;
- remaining capability, quality, routing, and enforcement gaps are recorded as post-v1
  Taskmaster tasks.

## Delivery Order

After Task 57 merges, begin with Task 50, followed by Tasks 51 and 52. Task 58 establishes
the content/backend foundation. Task 59 adds security and privacy review. Tasks 53 and 54
build the frontend/editorial and distribution/release layers. Task 60 consolidates quality
and operational readiness. Task 55 runs last against the complete suite.

Each implementation remains an independently reviewed task and PR.

## Task 57 Non-Goals

- no skill bodies or placeholders;
- no catalog entries, routing entries, or Codex skill links;
- no product or application code;
- no package, lockfile, runtime, framework, or CI workflow change;
- no generated review evidence;
- no promotion of subjective findings to blocking enforcement.
