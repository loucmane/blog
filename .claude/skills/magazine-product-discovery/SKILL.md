---
name: magazine-product-discovery
description: Turn nontechnical owner and reader needs into evidence-backed magazine product decisions, assumptions, open questions, and advisory requirements. Use for product discovery, audience or value-proposition definition, editorial-workflow framing, and requirements reconciliation; do not use for implementation, package upgrades, security-only audits, deployment, migrations, or release verification.
---

# Magazine Product Discovery

Create decision-ready product truth without turning uncertainty into invented requirements or
asking the owner to make technical choices.

## Trigger Contract

Use this skill for requests involving:

- product discovery or requirements framing;
- owner needs, reader needs, audience definition, or value proposition;
- editorial workflow outcomes and publishing-policy decisions;
- reconciliation of stale product language with current evidence;
- product-scope options, assumptions, open questions, risks, or experiments.

Do not use this skill as the primary workflow for:

- implementation or detailed interaction design;
- package or framework upgrades;
- security audit, threat modeling, or privacy review;
- deployment, data migration, release verification, or production operations.

When a request mixes discovery with a denied path, complete only the discovery portion and
hand off the other work explicitly. Detailed owner journeys belong to
`owner-publishing-ux`; stack selection belongs to `stack-research-adr`.

## Workflow

### 1. Establish Product Truth

Read the canonical PRD, current product documents, relevant architecture decisions, active
Taskmaster scope, and observable product behavior. Classify each input as current evidence,
historical context, assumption, conflict, or unresolved question. Never treat stale wording
as authoritative merely because it is committed.

### 2. Define the Decision

State the decision, affected owner or reader, decision deadline, known constraints, and what
would remain reversible. Choose one discovery mode:

- **frame** — turn an ambiguous idea into a bounded product question;
- **reconcile** — resolve conflicting requirements or terminology;
- **decide** — compare product options against explicit criteria;
- **review** — assess a proposal against current product truth.

### 3. Build the Evidence Ledger

Separate:

- sourced facts and observed behavior;
- direct owner statements;
- reader evidence or explicit lack of evidence;
- binding requirements and constraints;
- assumptions with confidence and consequence;
- open questions with an owner and next evidence source.

Browse when current external facts materially affect the decision. Prefer primary or
authoritative sources and cite them. Do not manufacture research, analytics, interviews, or
owner preferences.

### 4. Keep Owner Discovery Safe

Use plain language and ask at most three high-leverage questions at a time. Explain why each
answer matters and offer concrete choices when helpful. Never ask the owner to choose Git,
Markdown, frameworks, databases, deployment tools, or hosting-console settings.

Treat these as binding unless the owner changes them explicitly:

- normal publishing requires no developer or external traditional CMS;
- the owner needs drafts, recovery, preview, revisions, scheduling, and publish control;
- content and media remain portable and recoverable;
- reader quality includes editorial design, accessibility, performance, SEO, and trust.

### 5. Synthesize the Product Frame

Produce the smallest useful set of:

- target audience and priority jobs;
- editorial promise and differentiated value proposition;
- owner publishing outcome and reader journey outcome;
- content, taxonomy, media, distribution, and trust requirements;
- measurable success signals and explicit non-goals;
- option comparison with tradeoffs, evidence, reversibility, and recommendation;
- assumptions, open questions, risks, and cheapest next experiments.

Keep outcomes in product language. Do not select concrete packages or implementation
details unless an existing approved ADR already makes them a constraint.

### 6. Produce Portable Output

Read `references/discovery-output-contract.md`. Produce:

1. a human-readable discovery brief that can stand outside any agent or vendor; and
2. a schema-valid advisory review result using
   `schemas/agent-skills/review-result.schema.json`.

Map assumptions and open questions to non-blocking subjective findings. Cite files,
commands, or URLs in evidence. Store generated review evidence only beneath
`reports/agent-skills/` and ingest it through the supported project scripts or Aegis CLI.

### 7. Self-Review

Before handoff, verify:

- facts, assumptions, decisions, and questions are visibly distinct;
- owner language is nontechnical and no technical burden was shifted to the owner;
- the recommendation traces to evidence and declared criteria;
- uncertainty and rejected alternatives remain visible;
- subjective findings are advisory and non-blocking;
- the output identifies the next decision or experiment rather than pretending discovery is
  complete.

## Deterministic Fixtures

Positive and deny-path trigger fixtures live at
`tests/agent-skills/fixtures/magazine-product-discovery.json`. They define Task 50's trigger
contract for later routing dogfood without implementing Task 55's general router.
