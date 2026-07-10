# Task ID: 55

**Title:** Add Skill Routing Forward Evaluation and Five-PR Dogfood

**Status:** pending

**Dependencies:** 50, 51, 52, 53, 54, 58, 59, 60

**Priority:** medium

**Description:** Validate cross-agent skill selection and usefulness through deterministic routing tests, forward evaluation, and five pull requests of advisory dogfood.

**Details:**

Implement routing rules and result ingestion, forward-test skills without leaking expected answers, record false-positive and false-negative evidence across five task-scoped pull requests, and publish generated reports under reports/agent-skills without committing ephemeral output. Only deterministic schema, link, script, build, typecheck, lint, security, and critical browser checks may block CI; subjective LLM findings remain advisory until evidence supports a separate enforcement decision.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 55.1. Prove deterministic routing and five-PR forward evaluation

**Status:** pending
**Dependencies:** None

Execute the complete v1 routing, forward-evaluation, dogfood, metrics, and skill-lifecycle acceptance contract.

**Details:**

Acceptance requires deterministic routing tests with explicit positive, negative, and ambiguous trigger fixtures; forward evaluation that withholds expected answers from the reviewing agent; five real task-scoped pull requests spanning materially different skill combinations; published false-positive, false-negative, missed-routing, and unusable-advice metrics; advisory findings remaining non-blocking; only deterministic schema, link, script, test, build, typecheck, lint, security, accessibility, performance-budget, health, and critical browser checks being blocking-eligible; and documented promotion, revision, and retirement criteria for every registered skill.

### 55.2. Publish the v1 completion and post-v1 gap report

**Status:** pending
**Dependencies:** None

Prove the registered skill suite meets the explicit v1 completion definition and convert remaining gaps into post-v1 work.

**Details:**

V1 is complete only when every registered skill is implemented under .claude/skills and linked relatively for Codex under .agents/skills; the catalog and routing map validate; structured outputs are accepted by the review-result ingestion contract; five-PR dogfood is complete; measured routing and review results are published; no skill is promoted to blocking based only on subjective judgment; and every remaining capability, quality, or enforcement gap is captured as a post-v1 Taskmaster task.
