---
schema: gc.build.decomposition.v1
status: draft
title: Phase 5 Publishing and Distribution Proposed Decomposition (correction r2)
scope: >-
  Corrected proposed Blog DAG for Phase 5, derived from the accepted requirements and implementation
  plan. This artifact is a proposal for operator re-inspection. It is not authority to implement, and
  no bead, convoy, route, branch, or code change was created by producing it. It supersedes nothing:
  the r1 artifact is preserved byte-for-byte and this file is append-forward beside it.
effective: 2026-08-04
baseline_commit: 7d8b8f4
work_branch: agent/blog-0034-phase-5-prd-planning
workflow:
  id: "none -- not authorized"
  formula: "none -- not authorized"
  bead: blog-r7t
  root_bead: blog-0045
  dispatch_mode: direct-no-formula
  dispatch_exception: operator-authorized-artifact-first
  validation_gate: operator re-inspection of this artifact
  note: >-
    workflow.id and workflow.formula are schema-required. This run was an operator-authorized single
    bead direct dispatch with --no-formula, so no workflow instance and no formula control bead exist
    to name. The literal value is recorded rather than a fabricated identifier.
methodology:
  pack: "none -- not authorized"
  name: direct-artifact-first
  version: 1
  note: >-
    methodology.name is real and is carried from the r1 run (gc.methodology on blog-m8m). No
    methodology pack supplied it, because no formula was cooked for this dispatch.
producer:
  formula: "none -- not authorized"
  stage: decomposition-proposal
  attempt: 2
  agent: blog/gc.task-decomposer-1
  template: task-decomposer-1
  session: gc__task-decomposer-ci-i26
correction:
  round: 2
  bead: blog-r7t
  predecessor_bead: blog-m8m
  predecessor_artifact: docs/planning/phase-5/decomposition.md
  predecessor_sha256: 8cd8fbc440fc9ceea6370ea636d4f6ebea153806244579174b9ca4af8799e23a
  disposition: >-
    append-forward. The r1 artifact and the closed producing bead blog-m8m are preserved unchanged.
    This file is a new artifact, not an edit of r1.
  corrects:
    - id: C-1
      summary: >-
        r1 frontmatter did not satisfy the pinned gc.build.decomposition.v1 schema. The validator
        rejects it for missing workflow.id, workflow.formula, methodology.pack, and producer.formula.
    - id: C-2
      summary: >-
        r1 expressed root linkage as fifteen slice-blocks-root edges only, which left every entry
        slice immediately ready and let slice readiness bypass the root prerequisite blog-0044.
    - id: C-3
      summary: >-
        r1 did not record the runtime fail-open dependency-satisfaction limitation, so its edge set
        read as an enforcement boundary rather than an authority graph.
    - id: C-4
      summary: >-
        r1 did not audit the blog-0045 session-metadata stamp written during the r1 run.
lineage:
  methodology: direct-artifact-first
  version: 1
  requirements:
    path: PRD.md
    sha256: 32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac
    status: draft
    note: accepted for decomposition; derived from the frozen canonical PRD, which wins on conflict
  plan:
    path: docs/planning/phase-5-publishing-distribution.md
    sha256: 14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4
    status: draft
    note: accepted plan, correction round 3
  plan_review:
    path: docs/planning/phase-5-plan-review.md
    sha256: 63e3ac9d1bca70b26e48ac4222a1d36aff9c0350875235790b7e1e918f56bfdb
    status: approved
    verdict: approved for decomposition only; implementation separately gated
  frozen_source:
    path: .taskmaster/docs/prd.txt
    sha256: b946fffbf27f4ab7bec3be6414cbbf05f37c0fb496b4fc3749745052ac7ef49a
    note: read-only context; unchanged and unconsumed by this stage
  adopted_root:
    bead: blog-0045
    title: Add Distribution Search SEO and Newsletter Foundations
    external: taskmaster:master:45
    note: existing implementation root, adopted rather than duplicated
proposal:
  node_count: 15
  pr_count: 15
  migration_count: 5
  dependency_edge_count: 23
  edge_breakdown:
    intra_phase_dependency_edges: 20
    root_prerequisite_gating_edges: 3
  parentage_link_count: 15
  root_type_change_proposed: task -> epic
  slices_mapped: [S1, S2, S3, S6a, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14]
  duplicate_audit: none found
  beads_minted: 0
  proposed_beads_created: 0
  convoys_created: 0
  implementation_convoys_proposed: 0
  implementation_dispatches: 0
  mutations_performed: >-
    none beyond this artifact, the blog-r7t worklog, and blog-r7t close metadata
trace:
  upstream:
    - path: PRD.md
      hash: sha256:32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac
      note: accepted requirements artifact (status draft)
      ids:
        - US-01
        - US-02
        - US-03
        - US-04
        - US-05
        - US-06
        - US-07
        - US-08
        - US-09
        - US-10
        - US-11
        - US-12
        - US-13
        - US-14
        - US-15
        - TS-01
        - TS-02
        - TS-03
        - TS-04
        - TS-05
        - TS-06
        - TS-07
        - TS-08
        - TS-09
        - TS-10
        - TS-11
        - TS-12
        - TS-13
        - TS-14
        - TS-15
        - TS-16
        - BR-01
        - BR-02
        - BR-03
        - BR-04
        - BR-05
        - BR-06
        - BR-07
        - BR-08
        - BR-09
        - BR-10
        - BR-11
        - BR-12
        - BR-13
        - BR-14
        - BR-15
        - AC-01
        - AC-02
        - AC-03
        - AC-04
        - AC-05
        - AC-06
        - AC-07
        - AC-08
        - AC-09
        - AC-10
        - AC-11
        - AC-12
        - AC-13
        - AC-14
        - AC-15
        - AC-16
        - AC-17
        - AC-18
        - OQ-01
        - OQ-02
        - OQ-03
        - OQ-04
        - OQ-05
        - OQ-06
        - OQ-07
        - OQ-08
        - OQ-09
        - OQ-10
    - path: docs/planning/phase-5-publishing-distribution.md
      hash: sha256:14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4
      note: accepted implementation plan, correction round 3; slice content and order carried verbatim
    - path: docs/planning/phase-5-plan-review.md
      hash: sha256:63e3ac9d1bca70b26e48ac4222a1d36aff9c0350875235790b7e1e918f56bfdb
      note: approved plan review; approved for decomposition only
    - path: .taskmaster/docs/prd.txt
      hash: sha256:b946fffbf27f4ab7bec3be6414cbbf05f37c0fb496b4fc3749745052ac7ef49a
      note: frozen canonical product truth; read-only, unchanged by this stage
    - path: docs/planning/phase-5/decomposition.md
      hash: sha256:8cd8fbc440fc9ceea6370ea636d4f6ebea153806244579174b9ca4af8799e23a
      note: r1 proposal; preserved byte-for-byte and corrected by this artifact, never edited
  coverage:
    - id: US-01
      status: covered
    - id: US-02
      status: covered
    - id: US-03
      status: covered
    - id: US-04
      status: covered
    - id: US-05
      status: covered
    - id: US-06
      status: covered
    - id: US-07
      status: covered
    - id: US-08
      status: covered
    - id: US-09
      status: covered
    - id: US-10
      status: covered
    - id: US-11
      status: covered
    - id: US-12
      status: covered
    - id: US-13
      status: covered
    - id: US-14
      status: covered
    - id: US-15
      status: covered
    - id: TS-01
      status: covered
    - id: TS-02
      status: covered
    - id: TS-03
      status: covered
    - id: TS-04
      status: covered
    - id: TS-05
      status: covered
    - id: TS-06
      status: covered
    - id: TS-07
      status: covered
    - id: TS-08
      status: covered
    - id: TS-09
      status: covered
    - id: TS-10
      status: covered
    - id: TS-11
      status: covered
    - id: TS-12
      status: covered
    - id: TS-13
      status: covered
    - id: TS-14
      status: covered
    - id: TS-15
      status: covered
    - id: TS-16
      status: covered
    - id: BR-01
      status: covered
    - id: BR-02
      status: covered
    - id: BR-03
      status: covered
    - id: BR-04
      status: covered
    - id: BR-05
      status: covered
    - id: BR-06
      status: covered
    - id: BR-07
      status: covered
    - id: BR-08
      status: covered
    - id: BR-09
      status: covered
    - id: BR-10
      status: covered
    - id: BR-11
      status: covered
    - id: BR-12
      status: covered
    - id: BR-13
      status: covered
    - id: BR-14
      status: covered
    - id: BR-15
      status: covered
    - id: AC-01
      status: covered
    - id: AC-02
      status: covered
    - id: AC-03
      status: covered
    - id: AC-04
      status: covered
    - id: AC-05
      status: covered
    - id: AC-06
      status: covered
    - id: AC-07
      status: covered
    - id: AC-08
      status: covered
    - id: AC-09
      status: covered
    - id: AC-10
      status: covered
    - id: AC-11
      status: covered
    - id: AC-12
      status: covered
    - id: AC-13
      status: covered
    - id: AC-14
      status: covered
    - id: AC-15
      status: covered
    - id: AC-16
      status: covered
    - id: AC-17
      status: covered
    - id: AC-18
      status: covered
    - id: OQ-01
      status: deferred
      rationale: >-
        PRD authority is an owner decision. Every proposed node treats PRD.md as derived and leaves
        docs/README.md and .taskmaster/docs/prd.txt untouched, so no node depends on the answer.
    - id: OQ-02
      status: deferred
      rationale: >-
        Email provider selection belongs to a Phase 5 ADR outside the slice set. P5-S9-EMAIL-ADAPTER
        binds the port, outbox usage, retry budget, and idempotency and ships a console adapter, so
        the choice changes one adapter file. No bead is proposed for the ADR itself.
    - id: OQ-03
      status: deferred
      rationale: >-
        Analytics provider and consent surface belong to an ADR plus the owner privacy stance.
        P5-S10-ANALYTICS-VITALS ships an identifier-free first-party sink needing no consent banner;
        a provider requiring consent would add a slice this proposal does not size.
    - id: OQ-04
      status: deferred
      rationale: >-
        Confirmed versus single opt-in is a jurisdictional decision for the owner.
        P5-S8-SUBSCRIBERS-CONSENT implements confirmed opt-in because it is the reducible option;
        dropping to single opt-in later removes one job type without a schema change.
    - id: OQ-05
      status: covered
    - id: OQ-06
      status: covered
    - id: OQ-07
      status: covered
    - id: OQ-08
      status: covered
    - id: OQ-09
      status: covered
    - id: OQ-10
      status: covered
---

# Phase 5 Proposed Decomposition — Correction r2

**Program:** Task 33 — SOTA 2026 Magazine Foundation
**Increment:** Phase 5 (Taskmaster Task 45 / Blog bead `blog-0045`)
**Producing bead:** `blog-r7t` (operator-authorized direct `--no-formula` dispatch, correction round 2)
**Predecessor:** `blog-m8m` → `docs/planning/phase-5/decomposition.md` (r1), preserved unchanged

## Summary

This is a **draft proposal for re-inspection**. It describes a DAG that does not exist. Nothing in it
has been created.

Phase 5 turns a committed publication into something findable — search, related stories, feeds,
sitemap, canonical URLs, structured data, social cards, newsletter, analytics, and operational
visibility — without letting any of that touch the publication path. The accepted plan lands that as
**fifteen independently reversible delivery slices, S1–S14 plus S6a**, one slice per PR (AC-17), with
five SQL migrations. This artifact proposes the corresponding fifteen implementation nodes, their
dependency edges, and their relationship to the adopted root `blog-0045`.

It is the **append-forward correction** of the r1 proposal. The r1 artifact is preserved byte-for-byte
at SHA-256 `8cd8fbc4…9e23a` and was not edited; the closed producing bead `blog-m8m` was not touched.
Four things are corrected, and everything else is carried across unchanged:

| Correction | What r1 said | What r2 says |
| --- | --- | --- |
| C-1 schema validity | frontmatter omitted `workflow.id`, `workflow.formula`, `methodology.pack`, `producer.formula` | all required fields present and truthful; the four that do not exist say `none -- not authorized` |
| C-2 DAG semantics | fifteen `blocks: blog-0045` edges only; no slice inherited the root's prerequisite | root proposed as `epic` with parented children, plus three explicit gating edges from `blog-0044` |
| C-3 runtime honesty | silent on enforcement | the fail-open dependency-satisfaction limitation is stated; edges are an authority graph, not a runtime safety boundary |
| C-4 stamp audit | not audited | the `blog-0045` session-metadata stamp is audited below with its exact delta |

**Counts: proposed beads 0, minted beads 0, convoys 0, implementation dispatches 0.** Re-inspection is
required before anything is minted.

### Why the schema fields say "none -- not authorized"

The pinned `gc.build.decomposition.v1` schema requires `workflow.id`, `workflow.formula`,
`methodology.pack`, `producer.formula`, `producer.stage`, `producer.attempt`, `status`, and `trace`.
That schema assumes a formula-driven workflow, because in the normal path a `decomposition-base`
formula cooks a workflow root, a step bead, and a Ralph validation-loop control bead, and those beads
carry the identifiers.

This run had none of that. It was an **operator-authorized single-bead direct dispatch with
`--no-formula`**, so there is no workflow instance, no formula, no methodology pack, and no formula
control bead. Rather than invent identifiers to satisfy the validator — which would make the artifact
validate by lying about its own provenance — the four fields that have no referent carry the literal
`none -- not authorized`, and this section explains why. `methodology.name`, `producer.stage`,
`producer.attempt`, `status`, and `trace` are all real and are recorded truthfully.

The consequence is the same one r1 recorded: because no formula control bead exists, **operator
re-inspection of this artifact is the validation gate**. Minting the proposed beads, creating a
convoy, and dispatching implementation are each separate authorizations that have not been given.

This proposal does not reinterpret the accepted requirements or plan. Every design statement and
acceptance criterion below is carried from the accepted plan at the digest pinned in `lineage`.

## Correction Scope And Preserved Evidence

Verified before and after writing this file:

| Preserved item | Pinned SHA-256 | Verified |
| --- | --- | --- |
| `docs/planning/phase-5/decomposition.md` (r1) | `8cd8fbc440fc9ceea6370ea636d4f6ebea153806244579174b9ca4af8799e23a` | unchanged |
| `PRD.md` | `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac` | unchanged |
| `docs/planning/phase-5-publishing-distribution.md` | `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4` | unchanged |
| `.taskmaster/docs/prd.txt` | `b946fffbf27f4ab7bec3be6414cbbf05f37c0fb496b4fc3749745052ac7ef49a` | unchanged |
| `blog-m8m` (closed producing bead) | canonical projection | unchanged |
| `blog-0045` (adopted root) | canonical projection | unchanged, no new mutation |

`.beads/interactions.jsonl`, `.gc/`, the Task 43 worktree, and PR #40 are outside this correction's
scope and were read at most, never written.

## Decomposition Conventions

These conventions are decomposition-stage choices, not content from the plan. All remain overridable.

**1. Node identity.** Each proposed bead carries a stable proposal key of the form
`P5-<slice>-<topic>`. The key is stable across re-issues of this artifact and is what the operator
approves; the Beads id is assigned at mint time and does not exist yet.

**2. Root linkage — corrected.** r1 declined to propose a type change on the adopted root and instead
gave every node a `blocks: blog-0045` edge. That is the defect this correction exists to fix (see
*Proposed Edges*). The corrected proposal is: **convert `blog-0045` from `task` to `epic` at mint
time** and mint the fifteen nodes as parented children `blog-0045.1` … `blog-0045.15`, matching the
store's existing multi-child convention (`blog-0043` is type `epic` with child `blog-0043.1`). Root
completion then derives from child completion, so the fifteen `blocks: blog-0045` edges are dropped.
Separately and independently, three explicit gating edges carry the root's prerequisite down to the
entry slices. The type change is proposed, not performed; `blog-0045` is still type `task` today.

**3. Priority.** `P1` for the wave 1 and wave 2 prerequisites — `S1`, `S2`, `S3`, `S6a` — because
every other slice waits on them and `S2` carries the AC-02 outage-isolation gate. `P2` for the
remaining eleven, matching the adopted root `blog-0045`'s own `P2`. The plan assigns no priorities;
this rule is the decomposer's and is freely overridable.

**4. Delivery naming.** One slice, one branch, one PR (AC-17), following the existing repository
convention seen at PR #40 (`feat/task-43-owner-publishing-foundation`): `feat/task-45-<slice>-<topic>`.

**Type.** Every proposed node is type `task`. The only proposed type change is the adopted root
`blog-0045` from `task` to `epic`.

## Existing Bead Store Audit (read-only)

Performed with read-only `bd show` against the Blog rig at `7d8b8f4`. No bead was modified. The r1
audit is carried forward unchanged; its conclusions were re-checked and still hold.

**Duplicates: none.** Title and status search across all statuses for `search`, `sitemap`, `rss`,
`feed`, `newsletter`, `subscriber`, `analytics`, `observability`, `outbox`, `redirect`, `card`,
`seo`, `vitals`, `discovery`, `distribution`, `email`, `privacy`, and `export` returned no bead
covering any of the fifteen slices. The only product-side matches were `blog-0045` itself. No
proposed node duplicates existing work.

**Adopted roots.**

| Bead | Title | State | Treatment |
| --- | --- | --- | --- |
| `blog-0045` | Add Distribution Search SEO and Newsletter Foundations | open, blocked | **Adopted** as the implementation root. Not duplicated. Proposed for conversion to `epic` with fifteen parented children. |
| `blog-m8m` | Draft Phase 5 decomposition artifact for inspection | closed | The r1 proposal's work and evidence bead. Preserved exactly; not reopened, not edited. |
| `blog-r7t` | Correct Phase 5 decomposition artifact for re-inspection | in_progress | This correction's own work and evidence bead. |

**Overlaps — related but distinct, deliberately not proposed here.**

| Bead | Relationship | Why it is not a Phase 5 node |
| --- | --- | --- |
| `blog-0043` / `blog-0043.1` (in progress, PR #40) | Owner Publishing Foundation writes the author link | `S6a` creates `article_authors` only; the editor that populates it is Task 43 work (plan R-4). |
| `blog-0044` (open) | Public Magazine Foundation owns reader presentation | `S14` ships minimal accessible UI only; art direction stays with Task 44 (OQ-08). Also the root prerequisite — see *Proposed Edges*. |
| `blog-0046` (blocked) | Phase 6 hardening consumes this phase's output | Managed scheduling of the dispatcher is explicitly out of scope (plan R-1). |
| `blog-0054` (blocked) | "Implement SEO and Release Witness **Skills**" | Agent-skill work. Name-level overlap with `S4`/`S5` product SEO only; no shared surface. |
| `blog-0060` (blocked) | "Quality, Reliability, and Observability **Skill**" | Agent-skill work, distinct from the `S11` product observability surface. |
| `blog-0059` (blocked) | "Security, Identity, and Privacy **Skill**" (Taskmaster 59) | **Operator observation, no change proposed:** the accepted plan names "Task 59" as the future owner login that re-hosts the `S12` page. The Blog store's Taskmaster-59 bead is a skill task. Whether these are the same intended work is an owner call; this proposal neither reinterprets the plan nor edits the bead. |
| `blog-3mn`, `blog-5zi`, `blog-3kb`, `blog-6ng` | Convoys from prior planning runs | Workflow infrastructure, not implementation work. Not adopted, not modified. |
| `blog-l4h` | Framework auto-convoy `sling-blog-r7t` | Created by the operator's routing of this correction bead because `--no-convoy` was omitted alongside `--no-formula`. It is a framework record, **not an implementation convoy**, and grants no minting or dispatch authority. Preserved append-forward; disposition is the operator's after this bead closes. |

**Blocked work.**

- `blog-0045` is blocked by `blog-0044` (open) and by `blog-0042` (closed). Only `blog-0044` is
  live. Under the store's existing edges the root cannot start until `blog-0044` closes. **In r1 that
  condition did not reach the proposed slices at all** — the correction below fixes exactly that.
- `blog-0045` blocks `blog-0046`; that downstream edge is unchanged.
- The `blog-0034` → `blog-0035` planning chain remains open and is outside this decomposition.

**Skipped work — deliberately not proposed as beads.**

| Not proposed | Rationale |
| --- | --- |
| OQ-02 email-provider ADR, OQ-03 analytics-provider ADR | The plan assigns both to ADR authority outside the slice set; each changes one adapter file. Proposing beads would invent scope. |
| Managed scheduling of the outbox dispatcher | Plan R-1 and Non-Goals place it in Task 46 / `blog-0046`. |
| The R-3 Node-middleware spike | The plan places it as the first task **inside** `S3`, not as its own slice. |
| Writing the author link from the editor | Task 43 (`blog-0043`), per plan R-4. |
| Taskmaster and Aegis legacy state repair | Frozen historical inputs; preserved, not updated. |

## Selected Downstream Formulas

**None — not authorized.**

No downstream formula is selected, cooked, or proposed by this artifact, and none was available to
select. In the normal `decomposition-base` path this stage would end by producing an implementation
convoy that a downstream implementation formula (`build-from-decompose`, `implementation-base`, or
similar) drains without knowing the planning methodology. That path was deliberately not taken:

- The dispatch was `--no-formula` by explicit operator authorization, recorded on `blog-m8m` as
  `gc.dispatch_mode=direct-no-formula` and `gc.dispatch_exception=operator-authorized-artifact-first`.
- The reason, carried from the r1 worklog, is that the cataloged continuation entrypoint
  (`build-from-decompose`) proved broader than the decomposition-only boundary the operator wanted:
  it would have carried straight through into minting and implementation.
- Selecting a downstream formula here would re-create precisely that over-broad authority through the
  artifact instead of through the dispatch. It is therefore out of scope by construction.

Choosing a downstream implementation formula is a separate operator decision, to be made after this
artifact is re-inspected and after minting is separately authorized.

## Implementation Convoy

**None — zero implementation convoys proposed, zero created.**

This artifact proposes no convoy and creates no convoy. `gc convoy create`, `gc convoy add`,
`gc sling`, `bd create`, and `bd dep` were not run and are not proposed as part of accepting this
artifact.

**Disclosure — the one convoy record that does exist.** The operator's routing of this correction
bead used `--no-formula` but omitted `--no-convoy`, so the framework auto-created convoy `blog-l4h`
(`sling-blog-r7t`). It is recorded here for completeness because an auditor reading the store will
find it:

- It is a **framework routing record**, not an implementation convoy. It contains this single
  artifact-only correction bead.
- It confers **no** minting authority, **no** dispatch authority, and **no** product authority.
- It is preserved append-forward and not modified by this run. Its disposition is the operator's
  after `blog-r7t` closes.
- Acceptance counts for this artifact therefore read: **implementation convoys proposed 0, created 0.**

If and when the operator authorizes minting, the implementation convoy is created at that point, from
the *Work Items* below, under its own authorization — not by this artifact.

## Work Items

Fifteen proposed nodes, listed in the plan's merge-wave order. Every node carries the same lineage
block; it is restated per node in full so each proposed bead is independently inspectable. All node
content — titles, types, priorities, design, acceptance criteria, slice and story IDs, delivery
branch and PR slot, migration ownership, rollback, and lineage digests — is retained from r1 unchanged.
**Only the dependency and gating lines changed**, per correction C-2.

Four acceptance conditions apply to **every** node in addition to its own, and are not repeated
below: **AC-16** the full gate list green on a task-scoped branch (`pnpm install --frozen-lockfile`
→ `pnpm typecheck` → `pnpm lint` → `pnpm format:check` → `pnpm security:audit` → `pnpm test` →
`pnpm test:content:integration` → `pnpm build` → `pnpm test:browser` → `pnpm test:smoke:web`, plus
`pnpm ci:taskmaster`, `pnpm ci:aegis`, `pnpm ci:guard`, `pnpm ci:agent-skills`); **AC-17** one PR
carrying its own rollback note; **AC-01** no provider type in domain code; **AC-18**
`.taskmaster/docs/prd.txt` unchanged at mode `0444` and sha256 `b946fff…ef49a`. Merge requires a
reviewed PR and explicit human approval on a clean working tree.

Every node is additionally proposed as a **child of the adopted root** `blog-0045` once that root is
converted to `epic`. That parentage is stated once here rather than repeated per node.

---

### P5-S1-SEARCH-QUERY — wave 1

- **Title:** Add the search query port and PostgreSQL search adapter
- **Type:** task · **Priority:** P1 · **Plan slice:** S1
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `blog-0044` *(root prerequisite, gating edge — entry slice)*
- **Blocks:** `P5-S2-OUTBOX-DISPATCHER`, `P5-S6-RELATED-STORIES`, `P5-S13-REBUILD-COMMAND`,
  `P5-S14-DISCOVERY-UI`
- **Delivery:** branch `feat/task-45-s1-search-query-port` · PR 1 of 15 · migration `0002_search_query_support`

**Design.** Add a `SearchQuery` port to `content/ports.ts` beside `SearchProjection`, which stays
write-only: `search(input: { query: string; limit: number; offset: number }): Promise<SearchResultPage>`
with `SearchResultPage = { readonly items: readonly SearchHit[]; readonly total: number }` and
`SearchHit = { articleId, slug, title, snippet, rank }`. `server/discovery/search-service.ts`
normalizes and length-caps the query, rejects control characters, and applies the empty-state
contract; `server/discovery/in-memory-search.ts` is the test double every downstream slice reuses.
`database/postgres-search-query.ts` ranks with
`ts_rank_cd(document, websearch_to_tsquery('english', $1))` and falls back to
`similarity(title, $1) > 0.3` when the tsquery yields no rows, so a typo still returns results;
`ts_headline` builds the snippet from `search_text` only, never from a draft revision. Migration
`0002_search_query_support.sql` with its `.down.sql` creates `pg_trgm`, a `gin_trgm_ops` index on
`article_search_documents.title`, and a covering index on `published_at DESC`, with a preflight that
raises a clear error if the extension cannot be created (OQ-06). Because
`article_search_documents` only ever receives published rows, no draft text is reachable through
search by construction rather than by filtering.

**Acceptance criteria.**
1. `SearchQuery` exists with the exact shape above; `SearchProjection` gains no read method.
2. Unit suites cover normalization, length cap, control-character rejection, and the documented
   empty state against the in-memory implementation.
3. The PostgreSQL adapter returns ranked published results, and an integration test proves the
   trigram fallback returns a result for a single-character typo where the tsquery returns none.
4. Snippets are sourced from `search_text` only; a test asserts no draft revision text can appear.
5. `0002` applies and reverses cleanly on empty and populated databases; the preflight fails loudly
   with a readable message when `pg_trgm` cannot be created.

**Rollback.** Drop the extension-dependent index and the query adapter; the write side and all Task
42 behavior are untouched.

**Lineage.** Requirements `PRD.md` sha256
`32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`; plan
`docs/planning/phase-5-publishing-distribution.md` sha256
`14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-08, TS-01, BR-06, AC-01,
OQ-06; methodology `direct-artifact-first`, version 1.

---

### P5-S2-OUTBOX-DISPATCHER — wave 1

- **Title:** Add the outbox dispatcher, index lifecycle, and full reindex
- **Type:** task · **Priority:** P1 · **Plan slice:** S2
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S1-SEARCH-QUERY`
- **Blocks:** `P5-S8-SUBSCRIBERS-CONSENT`, `P5-S9-EMAIL-ADAPTER`, `P5-S10-ANALYTICS-VITALS`,
  `P5-S11-OBSERVABILITY-JOBS`, `P5-S13-REBUILD-COMMAND`
- **Delivery:** branch `feat/task-45-s2-outbox-dispatcher` · PR 2 of 15 · migration `0003_outbox_retry_state`

**Design.** `server/outbox/dispatcher.ts` claims pending events with `FOR UPDATE SKIP LOCKED`,
executes the handler from a registry keyed by event `type`, and records the outcome through the
existing `completeOutboxEvent` path. Each claimed event executes and records in its **own
transaction inside a per-event boundary**, so no single failing, unsupported, or slow event can
abort the batch or stall unrelated events. A `type` with no registered handler is never dropped: it
is recorded failed with `lastError = 'unsupported event type: <type>'`, dead-lettered immediately
with `dead_lettered_at` set so it consumes no retry budget, surfaced through the S11 owner job view
as *needs attention*, and the batch continues. Handlers introduced here: `search.upsert`,
`article.unpublished`, `article.deleted`, `cache.revalidate`, and the new `article.slug-changed`.
`service.changeSlug` gains one `saveOutbox(..., 'article.slug-changed', ...)` call carrying
`fromSlug` and `toSlug` — the smallest correct fix for the silent-slug-change gap, required by
BR-04. Migration `0003_outbox_retry_state.sql` with its `.down.sql` adds `next_attempt_at`,
`dead_lettered_at`, and widens the status check constraint; `outboxStatuses` gains `dead_letter`.
Backoff is 1 min → 5 min → 30 min → 2 h → 12 h, dead-lettered after the fifth failure. Every handler
derives its idempotency key from `outbox_event.id` at the adapter boundary. `server/discovery/reindex.ts`
streams published articles into a shadow table `article_search_documents_rebuild` and swaps it in one
transaction, so there is no degraded-search window. Invocation is an `/api/internal/outbox/drain`
route guarded by a shared secret plus a `pnpm --filter web outbox:drain` script; managed scheduling
belongs to Task 46.

**Acceptance criteria.**
1. The AC-02 gate test `outbox/dispatcher.outage.integration.test.ts` passes: with email, analytics,
   card generation, and cache revalidation all forced to throw, the publication row commits, the
   article is publicly readable in the same request, each failed event is retried from the outbox,
   and a second delivery of every event produces no duplicate email, feed entry, index row, or
   analytics record.
2. The same suite seeds one unsupported `type` inside a batch of healthy events and asserts it is
   dead-lettered with a recorded reason, consumes no retry attempts, is visible as *needs attention*,
   and that **every other event in the batch still completes**.
3. `changeSlug` emits `article.slug-changed` with `fromSlug` and `toSlug`, proven by unit test.
4. Backoff advances 1 m / 5 m / 30 m / 2 h / 12 h and dead-letters on the fifth failure.
5. Full reindex swaps the shadow table in one transaction with no window in which search returns an
   incomplete corpus.
6. `0003` applies and reverses cleanly on empty and populated databases.

**Rollback.** Stop calling the drain entry point; events accumulate as `pending` and no canonical
state changes.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-01, US-02,
US-04, US-05, TS-02, BR-02, BR-03, BR-04, BR-05, AC-02; methodology `direct-artifact-first`, version 1.

---

### P5-S3-CANONICAL-REDIRECTS — wave 2

- **Title:** Add canonical URL construction and slug redirect resolution
- **Type:** task · **Priority:** P1 · **Plan slice:** S3
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `blog-0044` *(root prerequisite, gating edge — entry slice)*
- **Blocks:** `P5-S4-FEEDS-SITEMAP`, `P5-S5-STRUCTURED-DATA`, `P5-S7-SOCIAL-CARDS`
- **Delivery:** branch `feat/task-45-s3-canonical-redirects` · PR 3 of 15 · no migration

**Design.** `server/distribution/canonical.ts` is the single source of every public URL —
`canonicalArticleUrl(slug)`, `canonicalSectionUrl`, `absolute(path)` — reading the site origin from
configuration; feeds, sitemap, structured data, and cards call it and no other module builds a URL
by hand. `server/distribution/slug-resolution.ts` resolves a requested path to exactly one of four
outcomes: `current` (render), `redirect` (308 to the canonical slug, following the `slug_redirects`
chain with a visited set so a chained rename cannot loop), `gone` (410), or `unknown` (404) — the
plan's answer to OQ-09. Delivery is `packages/web/src/middleware.ts` on the **Node** middleware
runtime so the resolver can reach PostgreSQL through the existing pool, with results cached
in-process under a short TTL keyed by slug. The first task of the slice is the R-3 spike confirming
the Node middleware runtime on the deployment target; the recorded fallback is a rewrite to a
`/stories/gone` route handler that sets the 410 status.

**Acceptance criteria.**
1. Every public URL in the phase originates from `canonical.ts`; a test or lint rule asserts no
   hand-built article URL elsewhere.
2. AC-07: a chained slug change `a → b → c` resolves to a single 308 to `c`, with an explicit
   no-loop test.
3. A previously published, now unpublished or soft-deleted URL returns 410; a slug in redirect
   history returns 308; anything else returns 404.
4. The R-3 spike is recorded in the PR with its outcome, and the shipped mechanism is whichever of
   Node middleware or the route-handler fallback the spike selected.

**Rollback.** Remove the middleware; `stories/[slug]` returns to its current 404-only behavior.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-04, TS-05,
BR-04, AC-07, OQ-09; methodology `direct-artifact-first`, version 1.

---

### P5-S6A-AUTHOR-LINKAGE — wave 2

- **Title:** Add the article author linkage schema and projection
- **Type:** task · **Priority:** P1 · **Plan slice:** S6a
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `blog-0044` *(root prerequisite, gating edge — entry slice)*
- **Blocks:** `P5-S5-STRUCTURED-DATA`, `P5-S6-RELATED-STORIES`
- **Delivery:** branch `feat/task-45-s6a-author-linkage` · PR 4 of 15 · migration `0004_article_authors`

**Design.** Migration `0004_article_authors.sql` with its `.down.sql` adds
`article_authors (article_id, author_id, position, PRIMARY KEY (article_id, author_id))`, mirroring
the `article_taxonomies` shape, plus repository reads and an `AuthorProfile` projection. It is
schema and repository only: no port, no route, no user-visible surface. Writing the link from the
editor belongs to Task 43; this phase seeds it in fixtures and every consumer tolerates an empty set
— S5 omits `author` rather than emitting a placeholder `Person`, and S6 scores a shared author at
zero. It lands in wave 2 as its own PR because both S5 and S6 read the link it creates (AC-17).

**Acceptance criteria.**
1. `0004` applies and reverses cleanly on empty and populated databases.
2. The `AuthorProfile` projection returns linked authors in `position` order and an empty set when
   no link exists.
3. No port, route, or UI is introduced by this slice.
4. The PR description states the Task 43 cross-task dependency (plan R-4).

**Rollback.** Drop the join table; nothing canonical references it and both consumers already handle
the empty case.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids TS-06 (part),
TS-03 (part), US-09 (enabling), AC-05 (enabling); methodology `direct-artifact-first`, version 1.

---

### P5-S4-FEEDS-SITEMAP — wave 3

- **Title:** Add feeds, sitemap, robots, and index hygiene
- **Type:** task · **Priority:** P2 · **Plan slice:** S4
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S3-CANONICAL-REDIRECTS`
- **Blocks:** `P5-S13-REBUILD-COMMAND`
- **Delivery:** branch `feat/task-45-s4-feeds-sitemap` · PR 5 of 15 · no migration

**Design.** `server/distribution/feed.ts` and `sitemap.ts` are pure functions from a list of
published projections to a serialized document, so both are unit-testable without a database and
stable across repeated generation for unchanged input. Routes: `app/feed.xml/route.ts` (RSS 2.0;
Atom only if it costs one extra serializer), `app/sitemap.xml/route.ts` as an index plus
`app/sitemaps/[page]/route.ts`, and `app/robots.txt/route.ts`. Pagination thresholds are published
constants in `distribution/limits.ts`: the feed serves the newest 50 items with `rel="next"` /
`rel="prev"` links into a dated archive, and the sitemap index splits into pages of 5,000 URLs.
Ordering is `published_at DESC, article_id ASC` so output is deterministic under equal timestamps.
Caching is `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400`, invalidated through
the `cache.revalidate` and `article.slug-changed` handlers. `robots.txt` disallows `/preview`,
`/api`, and owner routes, and those routes additionally send `X-Robots-Tag: noindex, nofollow` per
response, so a leaked link is excluded twice.

**Acceptance criteria.**
1. AC-04: feed and sitemap output validates against their specifications, uses canonical URLs, is
   byte-stable across repeated generation for unchanged input, and paginates at the published
   thresholds, which are asserted by test rather than hard-coded at call sites.
2. Ordering is deterministic under equal `published_at`.
3. Draft, scheduled, preview, and soft-deleted articles are absent from both surfaces, registered
   through the shared AC-03 exclusion helper.
4. A slug change invalidates the cached feed and sitemap through the dispatcher handler.
5. `robots.txt` and the per-response header both exclude `/preview`, `/api`, and owner routes.

**Rollback.** Delete the route files; nothing else reads them.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-01, US-05,
US-11, TS-04, TS-08, BR-01, BR-15, AC-04; methodology `direct-artifact-first`, version 1.

---

### P5-S5-STRUCTURED-DATA — wave 3

- **Title:** Add server-rendered schema.org structured data
- **Type:** task · **Priority:** P2 · **Plan slice:** S5
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S3-CANONICAL-REDIRECTS`, `P5-S6A-AUTHOR-LINKAGE`
- **Blocks:** — (nothing)
- **Delivery:** branch `feat/task-45-s5-structured-data` · PR 6 of 15 · no migration

**Design.** `server/distribution/structured-data.ts` emits `Article`, `Person`, `BreadcrumbList`,
and the publication `Organization` as a server-rendered JSON-LD `<script>` built from canonical
fields — never parsed out of stored HTML, which does not exist because the content model is
structured JSON. `Person` is populated from the S6a `AuthorProfile` projection; with no linked
author the `author` field is omitted entirely rather than filled with a placeholder. Every URL comes
from the S3 canonical module.

**Acceptance criteria.**
1. AC-05: emitted `Article`, `Person`, and `BreadcrumbList` validate with required fields populated.
2. A test asserts no field is sourced outside canonical storage.
3. With no linked author, `author` is absent and the document still validates.
4. Draft, scheduled, preview, and soft-deleted articles emit no structured data, registered through
   the shared AC-03 exclusion helper.

**Rollback.** Remove the JSON-LD component; S6a's `article_authors` is untouched and still serves S6.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids TS-06, AC-05,
BR-01, BR-04; methodology `direct-artifact-first`, version 1.

---

### P5-S6-RELATED-STORIES — wave 3

- **Title:** Add deterministic related-story selection
- **Type:** task · **Priority:** P2 · **Plan slice:** S6
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S6A-AUTHOR-LINKAGE`, `P5-S1-SEARCH-QUERY`
- **Blocks:** — (nothing)
- **Delivery:** branch `feat/task-45-s6-related-stories` · PR 7 of 15 · no migration

**Design.** `server/discovery/related.ts` scores candidates with documented, configuration-driven
weights: shared taxonomy term `3.0` each capped at three terms, shared `taxonomies.kind = 'section'`
term `2.0`, shared author `1.0`, recency `0.5 × exp(-age_days / 45)`. Ties break on
`published_at DESC, article_id ASC`. The current article and every non-public article are excluded
**in SQL**, not in the view layer. When no signal matches, the fallback is the most recent articles
in the same section and then site-wide recency; the empty case returns an empty list rather than an
error. Weights live in `discovery/related-weights.ts` so the owner's editorial preference (OQ-07) is
a configuration change, not a code change.

**Acceptance criteria.**
1. BR-07: the returned set is deterministic for a given corpus state, proven by a repeated-run test.
2. The current article and every non-public article are excluded, asserted at the SQL boundary.
3. A shared author contributes zero when `article_authors` is empty, and the result is still valid.
4. The no-signal fallback degrades to same-section recency and then site-wide recency; an empty
   corpus returns an empty list.
5. Changing a weight in `related-weights.ts` changes ordering with no code edit.
6. Related-story selection stays within the 100 ms budget on the OQ-10 reference corpus.

**Rollback.** Callers fall back to recency; no schema change to revert.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-09, TS-03,
BR-07, OQ-07; methodology `direct-artifact-first`, version 1.

---

### P5-S7-SOCIAL-CARDS — wave 3

- **Title:** Add social cards with private pre-publication preview
- **Type:** task · **Priority:** P2 · **Plan slice:** S7
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S3-CANONICAL-REDIRECTS`
- **Blocks:** `P5-S13-REBUILD-COMMAND`
- **Delivery:** branch `feat/task-45-s7-social-cards` · PR 8 of 15 · no migration

**Design.** `app/api/cards/[articleId]/[revisionId]/route.ts` generates the image on demand, keyed by
article id **and** revision id so a given revision always yields the same bytes, with a long-lived
immutable cache header and a warm-on-publish handler in the dispatcher. **The public card route
serves published revisions only**: it resolves the requested revision through the same publication
state the reader routes use, and a draft, scheduled, previewed, unpublished, or soft-deleted revision
returns 404 rather than an image. A separate
`app/api/preview/cards/[articleId]/[revisionId]/route.ts` renders the **draft** revision behind the
existing `app/api/preview` token boundary, responding `Cache-Control: private, no-store` with
`X-Robots-Tag: noindex, nofollow`, disallowed under `/preview` and `/api` in robots, never warmed,
cached at the edge, or linked publicly; an unauthenticated or expired-token request returns 404, not
401, so it reveals nothing about whether an unpublished article exists. `app/preview/stories/[slug]`
gains a minimal, accessible social-preview panel showing the rendered card beside the title and
description. Cover selection runs **after** the route has authorized a revision: each route resolves
which revision it may render, and only then does the shared renderer read the validated document of
that selected revision, taking the first `mediaImage` node and resolving it through `MediaAsset`
(`originalKey`, `focalX`, `focalY`, `alt`). With no `mediaImage`, the layout falls back to a
typographic card; any generation error serves the static default card and records a
maintainer-visible warning. Card URLs appear in Open Graph and Twitter meta on `stories/[slug]`,
always on the canonical URL.

**Acceptance criteria.**
1. AC-06: card output is byte-stable per revision, cached, and falls back without failing a request
   when generation is forced to throw.
2. US-07: a revision rendered through the preview route and then published renders **byte-identical**
   output through the public route.
3. The public card route returns 404 for a draft, scheduled, previewed, unpublished, or soft-deleted
   revision; the preview route returns 404 without a valid token.
4. The preview route sends `no-store` and `noindex`, is never warmed or edge-cached, and is
   unreachable from any public page.
5. The renderer never selects a revision itself and never reads past the revision handed to it,
   asserted by test.
6. A card failure never fails a publish or a page request.
7. Card generation stays within 800 ms cold and 50 ms cached on the OQ-10 reference corpus.

**Rollback.** Point the meta tags at the static default and delete both card routes and the preview
panel; no canonical state is involved either way.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-05, US-07,
TS-07, BR-01, AC-03, AC-06, OQ-05; methodology `direct-artifact-first`, version 1.

---

### P5-S8-SUBSCRIBERS-CONSENT — wave 4

- **Title:** Add subscriber, consent, and subscription routes
- **Type:** task · **Priority:** P2 · **Plan slice:** S8
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S2-OUTBOX-DISPATCHER`
- **Blocks:** `P5-S9-EMAIL-ADAPTER`, `P5-S12-EXPORT-PRIVACY`, `P5-S14-DISCOVERY-UI`
- **Delivery:** branch `feat/task-45-s8-subscribers-consent` · PR 9 of 15 · migration `0005_subscribers_consent`

**Design.** Migration `0005_subscribers_consent.sql` with its `.down.sql` adds `subscribers` (an
app-generated `id` as primary key — never a provider identifier — with `email_canonical` unique,
`status`, and timestamps), `subscriber_consents` (`consent_text_version`, `source`, `granted_at`,
`withdrawn_at`), and `subscription_events` as append-only history.
`server/subscriptions/service.ts` implements confirmed (double) opt-in: submitting the form stores a
**pending** subscriber plus a consent record and queues `email.subscription-confirm` through the
outbox in the same transaction. Tokens are single-use, hashed at rest, and scoped to one action;
unsubscribe is a one-step, no-login confirmation that deactivates the subscription and appends the
withdrawal to consent history rather than deleting it. Routes: `app/api/subscriptions/route.ts`
(POST, rate-limited per IP and per address), `app/subscriptions/confirm/route.ts`, and
`app/subscriptions/unsubscribe/route.ts`.

**Acceptance criteria.**
1. AC-08: the three schemas are app-owned with reviewed SQL migrations plus a rollback artifact
   matching the Task 42 conventions, applying and reversing cleanly on empty and populated databases.
2. BR-08: an accepted submission stores a pending subscriber and a consent record and queues the
   confirmation through the outbox in the same transaction.
3. BR-09: a valid unsubscribe token deactivates the subscription in one step without login and
   retains the withdrawal in consent history.
4. Tokens are single-use, hashed at rest, and scoped to one action, asserted by test.
5. The POST response is byte-identical for new, pending, and already-confirmed addresses.
6. No provider identifier appears as a primary key.

**Rollback.** The down migration drops the three tables; because nothing canonical references them,
reverting costs only subscriber data, which the S12 export can preserve first.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-10, TS-09,
BR-08, BR-09, AC-08, OQ-04; methodology `direct-artifact-first`, version 1.

---

### P5-S9-EMAIL-ADAPTER — wave 4

- **Title:** Add the email sender port and outbox-driven delivery
- **Type:** task · **Priority:** P2 · **Plan slice:** S9
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S2-OUTBOX-DISPATCHER`, `P5-S8-SUBSCRIBERS-CONSENT`
- **Blocks:** — (nothing)
- **Delivery:** branch `feat/task-45-s9-email-adapter` · PR 10 of 15 · no migration

**Design.** `server/email/ports.ts` defines
`EmailSender.send(message: OutboundEmail, idempotencyKey: string): Promise<EmailSendResult>`, where
`OutboundEmail` carries recipient, subject, text and HTML bodies, and a list-unsubscribe header. Two
adapters ship: `ConsoleEmailSender` for development and tests, and one HTTP provider adapter selected
by the OQ-02 ADR, with the provider name appearing only in the adapter file and configuration. The
sender is invoked **only** from dispatcher handlers (`email.subscription-confirm`, `email.issue`),
never from a request path or the publish transaction, so a provider outage produces a retrying job
and nothing else. Newsletter templates stay minimal — enough to prove delivery through the adapter.

**Acceptance criteria.**
1. BR-10: with the provider down or rate-limited, delivery retries on the S2 backoff schedule,
   becomes a visible failed job after the documented attempt budget, and never mutates canonical
   article state.
2. The idempotency key is the `outbox_event.id` passed to the provider, and a replayed event sends no
   duplicate email.
3. No call path reaches `EmailSender` outside a dispatcher handler, asserted by test or lint rule.
4. The console adapter keeps every other slice testable with no provider credentials present.
5. No provider type appears in domain code.

**Rollback.** Switch configuration back to the console adapter; queued events stay pending.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-15, TS-10,
BR-10, AC-01, OQ-02; methodology `direct-artifact-first`, version 1.

---

### P5-S10-ANALYTICS-VITALS — wave 5

- **Title:** Add the privacy-conscious analytics sink and Web Vitals ingestion
- **Type:** task · **Priority:** P2 · **Plan slice:** S10
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S2-OUTBOX-DISPATCHER`
- **Blocks:** — (nothing)
- **Delivery:** branch `feat/task-45-s10-analytics-vitals` · PR 11 of 15 · migration `0006_distribution_telemetry`

**Design.** `server/analytics/ports.ts` defines `AnalyticsSink.record(event: AnalyticsEvent): Promise<void>`
with a first-party, cookieless, identifier-free default adapter that aggregates counts per route
pattern and day into `analytics_page_views_daily`. No IP address, no user agent string, and no
cross-site identifier is stored. `app/api/vitals/route.ts` accepts `navigator.sendBeacon` payloads
for LCP, INP, and CLS at a 10% client sample, validated with Zod and aggregated to p75 per route
pattern per day in `web_vitals_daily`; migration `0006_distribution_telemetry.sql` with its
`.down.sql` adds both tables. A shared `redactEventPayload()` strips query strings, tokens,
addresses, and any field not on an allowlist before anything is written, and that allowlist is the
test surface. Collection is disabled by construction on `/preview/**` and owner routes: the beacon
component is not rendered there and the route handler rejects those route patterns server-side as
well. The prototype leftovers `packages/web/src/types/analytics.ts` and `types/donor.ts` are deleted
in this slice so the only analytics contract in the tree is the new port.

**Acceptance criteria.**
1. AC-10: a redaction test asserts no identifier, address, draft text, or secret survives into a
   written payload, and asserts **zero** collection on preview and owner routes at both the client
   and the server.
2. Vitals are sampled at 10%, validated, and aggregated to p75 per route pattern per day.
3. `0006` applies and reverses cleanly on empty and populated databases.
4. `types/analytics.ts` and `types/donor.ts` are removed and nothing imports them.
5. AC-15: reader routes touched here ship no editor code and record p75 LCP/INP/CLS instrumentation.

**Rollback.** Set the sink to the no-op adapter and drop the two aggregate tables.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-15, TS-11,
TS-12, BR-11, AC-10, AC-15, OQ-03; methodology `direct-artifact-first`, version 1.

---

### P5-S11-OBSERVABILITY-JOBS — wave 5

- **Title:** Add structured logging, health checks, and publishing-job visibility
- **Type:** task · **Priority:** P2 · **Plan slice:** S11
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S2-OUTBOX-DISPATCHER`
- **Blocks:** `P5-S12-EXPORT-PRIVACY`
- **Delivery:** branch `feat/task-45-s11-observability-jobs` · PR 12 of 15 · no migration

**Design.** `server/observability/logger.ts` emits structured JSON with a correlation id taken from
an inbound request header or generated per request and propagated through dispatcher handlers, so a
publish and its downstream jobs share one id. `redact()` removes draft bodies, tokens, email
addresses, and signed media URLs, and is a pure function with its own test table.
`app/api/health/route.ts` reports database, search, email adapter, and job-queue status with a
per-check timeout and no secret leakage, distinguishing degraded from down.
`server/observability/jobs.ts` projects `publishing_jobs` and `outbox_events` into an owner-readable
view — *waiting to send*, *sending*, *sent*, *waiting to retry*, *needs attention* — plus a
maintainer view carrying attempts, last error, and next attempt time. Every dead-lettered event
reaches *needs attention* with a plain-language reason, including the S2 unsupported-type case
("this site does not know how to handle this kind of job yet"), while the maintainer view carries the
raw event type and `lastError`.

**Acceptance criteria.**
1. AC-11: health reports all four subsystems, distinguishes degraded from down, honors per-check
   timeouts, and leaks no secret; correlation-id propagation and redaction are verified by test.
2. AC-12: the job view renders queued, running, succeeded, failed, and retrying states in
   owner-readable language with a maintainer detail view.
3. BR-12: every logged server error, job failure, or slow request carries a correlation id and
   redacts draft bodies, tokens, addresses, and signed URLs.
4. A dead letter is never invisible: the S2 unsupported-type event appears as *needs attention* with
   a plain-language reason and the raw type in the maintainer view.

**Rollback.** Remove the routes; the logger degrades to the framework default.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-03, US-14,
TS-13, TS-14, BR-12, AC-11, AC-12; methodology `direct-artifact-first`, version 1.

---

### P5-S12-EXPORT-PRIVACY — wave 6

- **Title:** Add subscriber export, erasure, and the owner privacy page
- **Type:** task · **Priority:** P2 · **Plan slice:** S12
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S8-SUBSCRIBERS-CONSENT`, `P5-S11-OBSERVABILITY-JOBS`
- **Blocks:** — (nothing)
- **Delivery:** branch `feat/task-45-s12-export-privacy` · PR 13 of 15 · no migration

**Design.** Extend `content/portability.ts` to `PORTABLE_CONTENT_VERSION = 2`, adding `subscribers`,
`consents`, `subscriptionEvents`, and `redirects` sections; the reader accepts version 1 bundles and
fills the new sections as empty so older exports stay importable. `subscriptions/erasure.ts` removes
personal fields — address, name, tokens — while retaining an anonymized consent trail of subscriber
id, consent text version, and granted and withdrawn timestamps. `subscriptions/owner-operations.ts`
exposes three operations in owner language: **how many people subscribed** (counts by state plus the
newest-subscription date, aggregates only, no addresses listed), **export one subscriber** (a
portable version 2 bundle including consent history), and **delete one subscriber**. One module,
three entry points, no second implementation: routes under
`app/api/owner/subscribers/{summary,export,erase}/route.ts` and paired maintainer scripts
`pnpm --filter web subscribers:summary|export|erase`. `app/owner/subscribers/page.tsx` is one
server-rendered screen that opens with the counts written as a readable sentence and carries two
labelled forms — export one subscriber, and delete one subscriber with the address typed a second
time to confirm and the retained anonymized trail explained *before* the button is pressed. The page
and its routes sit behind the **same** shared server-side secret that already guards
`/api/internal/outbox/drain`: the owner pastes that secret into an unlock field and the existing
guard returns a short-lived `HttpOnly`, `SameSite=Strict`, secure cookie carrying a signed marker —
not the secret itself — plus a *lock* control that clears it. No account, no password store, no
second credential; Task 59 later replaces that boundary without changing this module or its routes.
The page sends `noindex` and `no-store`, is outside analytics collection by the S10 owner-route rule,
works without client JavaScript, is single-column and usable on a phone, and meets the S14
accessibility bar. Every export and erasure appends an audit record and emits a structured S11 log
line with the address redacted.

**Acceptance criteria.**
1. AC-09: the export/import round trip — export, empty database, import, deep-equal on canonical
   JSON — passes with subscribers, consent history, and redirects included, and a version 1 bundle
   still imports.
2. BR-14: erasure removes personal data while preserving that consent was given and later withdrawn.
3. The owner page is reachable only with the existing shared secret, lists no addresses, shows counts
   by state, downloads a bundle, refuses erasure until the address is typed back, and reports an
   unknown address plainly ("no subscriber with that address; nothing was deleted").
4. Erasure is idempotent.
5. Page, routes, and scripts all call the one operations module; no second implementation exists.
6. Every export and erasure produces an audit record and a redacted log line, identically from page,
   route, or script.
7. The page passes axe plus a keyboard-only flow and functions with client JavaScript disabled.
8. No migration and no table is introduced by this slice.

**Rollback.** Version 2 export is additive and the reverted reader still parses version 1; the page,
routes, and scripts are read-mostly additions removable without touching subscriber data, and
deleting the page leaves the routes and scripts working.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-06, TS-15,
BR-14, AC-09; methodology `direct-artifact-first`, version 1.

---

### P5-S13-REBUILD-COMMAND — wave 6

- **Title:** Add the derived-store rebuild command
- **Type:** task · **Priority:** P2 · **Plan slice:** S13
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S1-SEARCH-QUERY`, `P5-S2-OUTBOX-DISPATCHER`, `P5-S4-FEEDS-SITEMAP`,
  `P5-S7-SOCIAL-CARDS`
- **Blocks:** — (nothing)
- **Delivery:** branch `feat/task-45-s13-rebuild-command` · PR 14 of 15 · no migration

**Design.** `packages/web/scripts/rebuild-derived.mjs`, wired as the root script
`distribution:rebuild`, following the `test:content:integration` script convention. It truncates only
derived stores — `article_search_documents`, the card cache, and the feed/sitemap cache — and
rebuilds them from canonical revisions through the **same handler code the dispatcher uses**, so
there is no second implementation, and performs **no canonical write**, asserted by a post-run
checksum over the canonical tables.

**Acceptance criteria.**
1. AC-13: with the derived stores emptied, the documented command reconstructs search, feeds,
   sitemap, and cards to an equivalent state, verified by integration test.
2. BR-13: a checksum over the canonical tables is identical before and after the run.
3. The rebuild calls the dispatcher's handlers rather than reimplementing them.
4. The command is documented and repeatable from a clean checkout.

**Rollback.** The script is additive and read-only against canonical data.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-13, TS-16,
BR-13, AC-13; methodology `direct-artifact-first`, version 1.

---

### P5-S14-DISCOVERY-UI — wave 6

- **Title:** Add the minimal accessible search and subscription surfaces
- **Type:** task · **Priority:** P2 · **Plan slice:** S14
- **Proposed parent:** `blog-0045` (as epic)
- **Depends on:** `P5-S1-SEARCH-QUERY`, `P5-S8-SUBSCRIBERS-CONSENT`
- **Blocks:** — (nothing)
- **Delivery:** branch `feat/task-45-s14-discovery-ui` · PR 15 of 15 · no migration

**Design.** Per the OQ-08 boundary, this phase ships `app/search/page.tsx` and a subscription form as
**minimal, unstyled-but-accessible** components built from the existing `packages/ui` primitives; art
direction, layout, and the finished magazine presentation stay with Task 44. Search results announce
their count through a polite live region, the empty and error states are reachable by keyboard, focus
is never trapped in the results region, and every control has a visible focus ring at WCAG 2.2 AA
contrast. Playwright plus axe cover the search page (results, empty, error) and the subscription form
(idle, invalid address, submitted), extending `tests/e2e/` and the accessibility-baseline ratchet in
`tests/e2e/accessibility-baseline.json`.

**Acceptance criteria.**
1. AC-14: automated axe checks pass on search results, the empty state, the error state, and the
   subscription form, with documented keyboard and screen-reader verification at WCAG 2.2 AA.
2. The result count is announced through a polite live region and focus is never trapped.
3. The accessibility-baseline ratchet is extended rather than relaxed.
4. Search API responses stay within the 200 ms p95 warm server budget on the OQ-10 reference corpus.
5. No art direction or layout work beyond the minimal accessible components enters this slice.

**Rollback.** Remove the two routes; the machine-readable surfaces are unaffected.

**Lineage.** Requirements sha256 `32e43701a52bfbcd8a573139f37c2566b4a9f246fa80cf2840807c18f0996cac`;
plan sha256 `14bf34a5ac2a6d22d47a6774d93ec408a417e277b451d2eda30250c9fb703cb4`; ids US-08, US-10,
US-12, AC-14, AC-15, OQ-08; methodology `direct-artifact-first`, version 1.

---

## Proposed Edges

**23 proposed dependency edges: 20 intra-phase plus 3 root-prerequisite gating edges — plus 15
parentage links under the adopted root once it becomes an epic.** Every edge is a proposal; none
exists in the store.

### What r1 got wrong, precisely

r1 proposed exactly one class of root linkage: each of the fifteen nodes declared `blocks: blog-0045`.
Read as a dependency graph, that means **the root depends on the slices**. It does not mean the
slices depend on anything.

The consequence is the defect. `blog-0045` is blocked by `blog-0044`, which is open. Under r1's edge
set, that prerequisite constrained only `blog-0045` itself. The three entry slices — S1, S3, S6a —
had no blocker at all, so the moment they were minted they would be **ready**, and an unattended
worker could claim and implement them while `blog-0044`, the prerequisite the operator deliberately
placed on this whole increment, was still open. The root's gate would have been bypassed by its own
children. r1 noticed that `blog-0045` was blocked and wrote it down as "the single most consequential
thing to decide", but it did not carry that condition into the edges, so the artifact described a DAG
that silently discarded it.

### The corrected shape

Two independent changes, in the correct direction:

**1. Root completion via parentage, not via fifteen reverse edges.** Convert `blog-0045` from `task`
to `epic` at mint time and mint the fifteen nodes as parented children `blog-0045.1` …
`blog-0045.15`, matching the store's existing convention (`blog-0043` is an `epic` with child
`blog-0043.1`). Root completion then derives from child completion. The fifteen `blocks: blog-0045`
edges from r1 are **dropped** — with parentage they are redundant, and keeping them alongside
parentage is what made the r1 graph read as if the slices were prerequisites of their own parent.

**2. The root prerequisite is carried down to the entry slices — this is the actual fix.** Add three
explicit gating edges so that `blog-0044` blocks each entry slice:

| # | Blocker | Blocks | Why |
| --- | --- | --- | --- |
| G1 | `blog-0044` | P5-S1-SEARCH-QUERY | entry slice; no intra-phase blocker would otherwise gate it |
| G2 | `blog-0044` | P5-S3-CANONICAL-REDIRECTS | entry slice; no intra-phase blocker would otherwise gate it |
| G3 | `blog-0044` | P5-S6A-AUTHOR-LINKAGE | entry slice; no intra-phase blocker would otherwise gate it |

Three edges are sufficient for all fifteen. S1, S3, and S6a are the only nodes with no intra-phase
blocker, and every one of the remaining twelve transitively depends on at least one of them: S2←S1;
S4←S3; S5←S3,S6a; S6←S6a,S1; S7←S3; S8←S2←S1; S9←S2,S8; S10←S2; S11←S2; S12←S8,S11;
S13←S1,S2,S4,S7; S14←S1,S8. So gating the three entry slices gates the whole set, and no slice can
become ready before `blog-0044` closes.

These two changes are independent. **If the operator declines the epic conversion**, correction 2
still stands on its own: keep r1's fifteen `blocks: blog-0045` completion edges, and add G1–G3
anyway. The gating edges are the correction; the epic conversion is the tidier way to express root
completion.

### Intra-phase dependency edges (20) — unchanged from r1 and from the accepted plan

| # | Blocker | Blocks | Source |
| --- | --- | --- | --- |
| 1 | P5-S1-SEARCH-QUERY | P5-S2-OUTBOX-DISPATCHER | S2 *Depends on:* S1 |
| 2 | P5-S1-SEARCH-QUERY | P5-S6-RELATED-STORIES | S6 *Depends on:* S6a, S1 |
| 3 | P5-S1-SEARCH-QUERY | P5-S13-REBUILD-COMMAND | S13 *Depends on:* S1, S2, S4, S7 |
| 4 | P5-S1-SEARCH-QUERY | P5-S14-DISCOVERY-UI | S14 *Depends on:* S1, S8 |
| 5 | P5-S2-OUTBOX-DISPATCHER | P5-S8-SUBSCRIBERS-CONSENT | S8 *Depends on:* S2 |
| 6 | P5-S2-OUTBOX-DISPATCHER | P5-S9-EMAIL-ADAPTER | S9 *Depends on:* S2, S8 |
| 7 | P5-S2-OUTBOX-DISPATCHER | P5-S10-ANALYTICS-VITALS | S10 *Depends on:* S2 |
| 8 | P5-S2-OUTBOX-DISPATCHER | P5-S11-OBSERVABILITY-JOBS | S11 *Depends on:* S2 |
| 9 | P5-S2-OUTBOX-DISPATCHER | P5-S13-REBUILD-COMMAND | S13 *Depends on:* S1, S2, S4, S7 |
| 10 | P5-S3-CANONICAL-REDIRECTS | P5-S4-FEEDS-SITEMAP | S4 *Depends on:* S3 |
| 11 | P5-S3-CANONICAL-REDIRECTS | P5-S5-STRUCTURED-DATA | S5 *Depends on:* S3, S6a |
| 12 | P5-S3-CANONICAL-REDIRECTS | P5-S7-SOCIAL-CARDS | S7 *Depends on:* S3 |
| 13 | P5-S6A-AUTHOR-LINKAGE | P5-S5-STRUCTURED-DATA | S5 *Depends on:* S3, S6a |
| 14 | P5-S6A-AUTHOR-LINKAGE | P5-S6-RELATED-STORIES | S6 *Depends on:* S6a, S1 |
| 15 | P5-S4-FEEDS-SITEMAP | P5-S13-REBUILD-COMMAND | S13 *Depends on:* S1, S2, S4, S7 |
| 16 | P5-S7-SOCIAL-CARDS | P5-S13-REBUILD-COMMAND | S13 *Depends on:* S1, S2, S4, S7 |
| 17 | P5-S8-SUBSCRIBERS-CONSENT | P5-S9-EMAIL-ADAPTER | S9 *Depends on:* S2, S8 |
| 18 | P5-S8-SUBSCRIBERS-CONSENT | P5-S12-EXPORT-PRIVACY | S12 *Depends on:* S8, S11 |
| 19 | P5-S8-SUBSCRIBERS-CONSENT | P5-S14-DISCOVERY-UI | S14 *Depends on:* S1, S8 |
| 20 | P5-S11-OBSERVABILITY-JOBS | P5-S12-EXPORT-PRIVACY | S12 *Depends on:* S8, S11 |

### Count reconciliation against r1

| Quantity | r1 | r2 | Why it changed |
| --- | --- | --- | --- |
| Proposed nodes | 15 | 15 | unchanged |
| PRs | 15 | 15 | unchanged, one per slice (AC-17) |
| Migrations | 5 | 5 | unchanged |
| Intra-phase dependency edges | 20 | 20 | unchanged; carried from the accepted plan |
| Root-completion `blocks` edges | 15 | 0 | replaced by epic parentage |
| Root-prerequisite gating edges | 0 | 3 | **the correction**: `blog-0044` gates the three entry slices |
| Total dependency edges | 35 | 23 | 20 + 3 |
| Parentage links | 0 | 15 | root proposed as `epic` with fifteen children |
| Root type change proposed | none | `task` → `epic` | r1 declined to choose; r2 proposes it explicitly |

### Existing edges left unchanged

`blog-0044` → blocks → `blog-0045` and `blog-0042` → blocks → `blog-0045` (both pre-existing, the
second already closed) and `blog-0045` → blocks → `blog-0046` are **not** modified by this proposal.
The three gating edges are additive: they do not replace or remove `blog-0044` → `blog-0045`.

## Runtime Limitation — Read Before Trusting These Edges

The edges above express the **correct authority graph**: they state what must be true before each
slice may be worked. They are **not** a sufficient unattended runtime safety boundary.

The current core carries a known **fail-open dependency-satisfaction defect**. Where dependency
satisfaction fails open, a bead whose blockers are unmet can still be surfaced or claimed rather than
being held back. A correct edge set is therefore necessary but not sufficient: it records intent
faithfully and makes review possible, but it cannot by itself be relied on to *prevent* an unattended
worker from starting a slice whose prerequisite has not closed.

Three consequences follow, and they are the reason this artifact stops where it does:

1. **No implementation dispatch is authorized** by this artifact, and none may be inferred from the
   edge set being correct. Correct edges are not an enforcement mechanism.
2. **Attended review remains the enforcement boundary** for this increment. Until the fail-open
   defect is fixed, "blocked by `blog-0044`" is a statement to a human reviewer, not a guarantee to
   the scheduler.
3. **Minting is still a separate authorization.** Minting the fifteen nodes with correct edges does
   not make it safe to start them unattended; it makes the graph reviewable.

This limitation is recorded as a stated condition of the current platform, carried from the
dispatching operator. This run did not attempt to reproduce the defect, and did not run any workflow
that would have exercised it — doing so would have required dispatch authority this bead does not
carry. It is stated here rather than omitted because r1's silence on it let a correct-looking edge
set read as a safety guarantee.

## blog-0045 Session-Metadata Stamp Audit

The r1 run left a metadata stamp on the adopted root `blog-0045`. This section records what changed,
how it got there, and what it does and does not mean.

### Exact observed delta from the migrated baseline

`blog-0045` was created by `taskmaster-migration` on 2026-07-18T09:35:11Z. Its migrated siblings
`blog-0042`, `blog-0043`, and `blog-0044` were created in the same migration batch, are still
untouched, and serve as the control for what the baseline looked like.

| Field | Migrated baseline (per `blog-0042` / `blog-0043` / `blog-0044`) | `blog-0045` now | Delta |
| --- | --- | --- | --- |
| `metadata.gc.session_name` | absent | `gc__task-decomposer-ci-vrj` | **added** |
| `metadata.gc.work_dir` | absent | `/home/loucmane/dev/blog` | **added** |
| `metadata.migration` | nested JSON **object** | JSON **string** of the same content | **re-encoded**, content preserved |
| `updated_at` | `2026-07-18T09:35:11Z` | `2026-08-04T13:24:08Z` | **advanced** |
| `status`, `priority`, `issue_type`, `title`, `description`, `design`, `labels`, `external_ref`, dependencies | — | — | **unchanged** |

The `migration` re-encoding is worth stating precisely because it is easy to misread as data loss: the
converter payload is byte-identical in content, but it is now stored as an escaped JSON string rather
than a nested object. The control beads still hold it as an object. That is a side effect of the
metadata write path rewriting the whole metadata map as string values, not an edit to the migration
record.

No product-authority field changed. Title, description, design, type, priority, status, labels, and
every dependency edge are exactly as migrated.

### Mechanism

Determined from the gc runtime and the store, not inferred from the fact that a decomposition ran:

- **These keys are runtime session-resolution stamps, not product data.** The gc runtime documents
  the trio as exactly that: `gc.session_name` — "Resolving session name from `gc.session_name`. Empty
  if unstamped"; `gc.session_id` — "Resolving session ID from `gc.session_id`. Empty if unstamped";
  `gc.work_dir` — "Resolving session work dir from `gc.work_dir`. Empty if unstamped." They record
  *which live session is resolving a bead*, and are read back by the runtime and API surfaces.
- **The root-bead `gc.work_dir` stamp is functionally required by gc's own artifact-validation
  flow.** The runtime instructs workers to "read the launcher rig root from the workflow root bead's
  `gc.work_dir`, then run the same validator locally from that rig root with
  `GC_BEAD_ID=<claimed-step-id> .gc/scripts/checks/build-artifact-valid.sh`". The stamp on the root
  is how a downstream step finds the rig it must validate in. That is why the *root* carries it and
  not only the work bead.
- **Attribution.** The stamp value `gc__task-decomposer-ci-vrj` is the exact session that ran the r1
  bead `blog-m8m`. `blog-m8m` started at 2026-08-04T13:23:02Z; `blog-0045` was updated at
  13:24:08Z, 66 seconds later. `blog-m8m` declares `gc.root_bead_id: blog-0045`, which is the link
  from the work bead to the bead that got stamped.
- **Control, and the reason this correction did not repeat it.** `blog-r7t` carries **no**
  `gc.root_bead_id` — the claim protocol resolved it empty. Consistent with that, `blog-0045` was not
  re-stamped when `blog-r7t` was created (19:15:59Z) or claimed (19:36:44Z): its `updated_at` still
  reads `2026-08-04T13:24:08Z`. The stamp follows the work bead's declared root, and this bead
  declares none.

**Limit of the evidence.** The exact writing call site is inside the compiled gc runtime; no
corresponding `bd update` appears in `.beads/interactions.jsonl`, which records only the `blog-m8m`
close. So the mechanism above is established from the runtime's own field documentation, the
functional dependency on the root `gc.work_dir`, and the session/timestamp/root-link correlation —
not from an observed command line. That distinction is stated rather than smoothed over.

### Assessment and disposition

- The stamp is **runtime bookkeeping, not a product-authority change**. It did not alter Phase 5
  scope, status, or any edge.
- It is nonetheless a **mutation of an adopted product root by a stage whose declared boundary was
  "no bead other than the claimed one"**, which is why this correction was asked to audit it.
- **No new `blog-0045` mutation was made by this correction, and none was unavoidable.** The root was
  read-only throughout. Its projection digest is recorded before and after in the worklog.
- **Nothing is proposed to clean it up here.** Removing or rewriting the stamp would itself be an
  unauthorized mutation of the root. Disposition is the operator's.

## Proposed Merge Order

Slice numbering is a delivery label, not a merge order. The merge order below is the plan's wave
table, unchanged.

| Wave | Proposed nodes | Rationale (from the plan) |
| --- | --- | --- |
| 1 | P5-S1, P5-S2 | everything asynchronous depends on the dispatcher |
| 2 | P5-S3, P5-S6A | canonical URLs and author linkage are prerequisites for four surfaces |
| 3 | P5-S4, P5-S5, P5-S6, P5-S7 | independent of each other once waves 1–2 land |
| 4 | P5-S8, P5-S9 | subscriber schema before the email adapter that serves it |
| 5 | P5-S10, P5-S11 | telemetry and operations over a working dispatcher |
| 6 | P5-S12, P5-S13, P5-S14 | export, rebuild, and UI verify the finished set |

Every node appears in exactly one wave. Waves 4 and 6 contain an intra-wave edge (S8 → S9, and
S8/S11 → S12), which orders the PRs inside those waves. The whole table sits behind `blog-0044` via
the three gating edges; wave 1 is not startable until it closes.

## Migration Ownership

Five migrations, one owning node each. No proposed node introduces a migration outside this table.

| Migration | Owning node | Adds | Reversal |
| --- | --- | --- | --- |
| `0002_search_query_support` | P5-S1-SEARCH-QUERY | `pg_trgm`, trigram index on title, published-at index | drop indexes and extension |
| `0003_outbox_retry_state` | P5-S2-OUTBOX-DISPATCHER | `next_attempt_at`, `dead_lettered_at`, widened status constraint | drop columns, restore constraint |
| `0004_article_authors` | P5-S6A-AUTHOR-LINKAGE | `article_authors` join table | drop table |
| `0005_subscribers_consent` | P5-S8-SUBSCRIBERS-CONSENT | `subscribers`, `subscriber_consents`, `subscription_events` | drop tables |
| `0006_distribution_telemetry` | P5-S10-ANALYTICS-VITALS | `analytics_page_views_daily`, `web_vitals_daily` | drop tables |

## Coverage

Every upstream ID from the accepted requirements is accounted for below. This matrix is the single
authoritative coverage table in this artifact and matches `trace.coverage` in the front matter
exactly. r1 traced only US-01…US-15 in its front matter; r2 traces all seventy-four.

| ID | Status | Where addressed |
| --- | --- | --- |
| US-01 | covered | P5-S1, P5-S2, P5-S4 |
| US-02 | covered | P5-S2 outage-isolation gate test |
| US-03 | covered | P5-S11 |
| US-04 | covered | P5-S2 slug-changed event, P5-S3 |
| US-05 | covered | P5-S2, P5-S4, P5-S7 |
| US-06 | covered | P5-S12 |
| US-07 | covered | P5-S7 |
| US-08 | covered | P5-S1, P5-S14 |
| US-09 | covered | P5-S6 with the P5-S6A author signal |
| US-10 | covered | P5-S8, P5-S14 |
| US-11 | covered | P5-S4 |
| US-12 | covered | P5-S14 |
| US-13 | covered | P5-S13 |
| US-14 | covered | P5-S11 |
| US-15 | covered | P5-S9, P5-S10 |
| TS-01 | covered | P5-S1 |
| TS-02 | covered | P5-S2 |
| TS-03 | covered | P5-S6, P5-S6A |
| TS-04 | covered | P5-S4 |
| TS-05 | covered | P5-S3 |
| TS-06 | covered | P5-S5, P5-S6A |
| TS-07 | covered | P5-S7 |
| TS-08 | covered | P5-S4 |
| TS-09 | covered | P5-S8 |
| TS-10 | covered | P5-S9 |
| TS-11 | covered | P5-S10 |
| TS-12 | covered | P5-S10 |
| TS-13 | covered | P5-S11 |
| TS-14 | covered | P5-S11 |
| TS-15 | covered | P5-S12 |
| TS-16 | covered | P5-S13 |
| BR-01 | covered | P5-S4, P5-S5, P5-S7 |
| BR-02 | covered | P5-S2 |
| BR-03 | covered | P5-S2 |
| BR-04 | covered | P5-S2, P5-S3 |
| BR-05 | covered | P5-S2 |
| BR-06 | covered | P5-S1 |
| BR-07 | covered | P5-S6 |
| BR-08 | covered | P5-S8 |
| BR-09 | covered | P5-S8 |
| BR-10 | covered | P5-S2 retry budget, P5-S9 |
| BR-11 | covered | P5-S10 |
| BR-12 | covered | P5-S11 |
| BR-13 | covered | P5-S13 |
| BR-14 | covered | P5-S12 |
| BR-15 | covered | P5-S4 |
| AC-01 | covered | every node, no provider type in domain code |
| AC-02 | covered | P5-S2, Phase 5 outage-isolation gate |
| AC-03 | covered | P5-S1, P5-S4, P5-S5, P5-S7 through the shared exclusion helper |
| AC-04 | covered | P5-S4 |
| AC-05 | covered | P5-S5 |
| AC-06 | covered | P5-S7 |
| AC-07 | covered | P5-S3 |
| AC-08 | covered | P5-S8 |
| AC-09 | covered | P5-S12, Phase 5 export-and-privacy gate |
| AC-10 | covered | P5-S10 |
| AC-11 | covered | P5-S11 |
| AC-12 | covered | P5-S11 |
| AC-13 | covered | P5-S13 |
| AC-14 | covered | P5-S14 |
| AC-15 | covered | P5-S10, P5-S14 |
| AC-16 | covered | every node, full gate list |
| AC-17 | covered | every node, one PR with a rollback note |
| AC-18 | covered | every node, frozen PRD assertion |
| OQ-01 | deferred | owner decision; no node depends on the answer |
| OQ-02 | deferred | ADR; P5-S9 ships a console adapter so the choice is one file |
| OQ-03 | deferred | ADR plus owner privacy stance; P5-S10 needs no consent banner |
| OQ-04 | deferred | owner decision; P5-S8 implements the reducible option |
| OQ-05 | covered | P5-S7 on-demand generation decision |
| OQ-06 | covered | P5-S1 extension preflight |
| OQ-07 | covered | P5-S6 configurable weights |
| OQ-08 | covered | P5-S14 minimal accessible surface |
| OQ-09 | covered | P5-S3 410/308/404 resolution |
| OQ-10 | covered | performance budgets on P5-S1, P5-S6, P5-S7, P5-S14 |

The four deferred questions remain owner- or ADR-owned. Per the plan, each node runs on the stated
assumption and none is blocked by an unanswered question. No bead is proposed for the ADRs themselves.

## What Minting Would Do

Recorded for inspection only. **None of this has been done, and none of it is authorized by this
artifact.**

1. Convert `blog-0045` from `task` to `epic`.
2. Create 15 `task` beads as its children `blog-0045.1` … `blog-0045.15`, with the stated titles,
   priorities, designs, and acceptance criteria.
3. Create the 20 intra-phase dependency edges.
4. Create the 3 gating edges `blog-0044` → blocks → {P5-S1, P5-S3, P5-S6A}.
5. Leave `blog-0044` → `blog-0045` and `blog-0045` → `blog-0046` untouched.
6. Decide the `blog-0044` question on its merits — either close it first, or accept that no Phase 5
   slice is startable until it clears. The gating edges make that decision explicit instead of
   implicit; they do not make it for the operator.

Even after minting, **implementation dispatch remains a further, separate authorization**, and — per
*Runtime Limitation* — the gating edges are not by themselves a runtime guarantee.

## Acceptance Counters

| Counter | Value |
| --- | --- |
| Proposed beads created | 0 |
| Beads minted | 0 |
| Implementation convoys proposed | 0 |
| Implementation convoys created | 0 |
| Implementation dispatches | 0 |
| Routes, branches, PRs, commits created | 0 |
| Beads mutated by this run | 1 (`blog-r7t`, the claimed correction bead only) |
| Files written by this run | 2 (this artifact and the `blog-r7t` worklog) |
| Framework auto-convoy disclosed | 1 (`blog-l4h`, routing record, no authority) |

Re-inspection by the operator is required before any of the counters above may become non-zero.
