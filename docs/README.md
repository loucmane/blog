# Documentation Truth Map

This index separates current product truth from preserved prototype and workflow history.

## Canonical Product Truth

| Area | Document | Authority |
| --- | --- | --- |
| Product requirements | [Canonical PRD](../.taskmaster/docs/prd.txt) | Binding product outcomes and constraints |
| Vision | [Product vision](./product/vision.md) | Audience, value, experience, and boundaries |
| Owner workflow | [Owner workflow](./product/owner-workflow.md) | Editorial lifecycle and recovery behavior |
| Content model | [Content model](./product/content-model.md) | Domain concepts, revisions, portability |
| Quality | [Nonfunctional requirements](./product/nonfunctional-requirements.md) | Accessibility, performance, security, operations |
| Architecture | [CMS-less magazine foundation](./architecture/cmsless-magazine-foundation.md) | Target system boundaries and portability model |
| Stack research | [July 2026 decision matrix](./research/2026-07-stack-decision-matrix.md) | Current primary-source evidence and targets |
| Risk validation | [Spike plan](./research/spike-plan.md) | Required proofs before risky implementation |
| Delivery | [Foundation roadmap](./migration/2026-foundation-roadmap.md) | Reversible planning and modernization batches |
| Deployment | [Target platform](./deployment/target-platform.md) | Managed default and portable fallback |
| Recovery | [Backup and restore](./deployment/backup-restore.md) | Data ownership and recovery contract |
| Decisions | [Architecture decision records](./decisions/) | Concrete provisional and accepted choices |

## Superseded Material

- `.taskmaster/docs/archive/2025-legacy-prd.txt` preserves the former "Mom's Blog" PRD.
- `docs/architecture/overview.md` now acts as a redirect and current-versus-target summary.
- Older files under `docs/development/`, `docs/design/`, and most of `docs/ai/` describe prototype, animal-foundation, generic-demo, or historical agent-workflow experiments. They remain evidence, not current product authority.
- Existing Taskmaster tasks 1–32 are classified in [legacy task reconciliation](./product/legacy-task-reconciliation.md) and preserved under a legacy task tag.

Historical material must not override the canonical PRD or accepted ADRs.

## Decision Status

ADRs in the first planning pull request are **provisional** when they depend on a spike or baseline result. A provisional ADR becomes accepted only after its named verification gate passes and the evidence is linked from the ADR.

## Change Discipline

- Product outcomes belong in the PRD and product documents.
- Package versions and provider choices belong in the stack matrix and ADRs.
- Verification evidence belongs in task reports and Aegis/legacy S:W:H:E surfaces.
- Legacy history is archived or labeled; it is not silently rewritten.
