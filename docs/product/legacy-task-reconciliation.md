# Legacy Taskmaster Reconciliation

**Status:** Canonical classification for tasks 1–32

**Updated:** 2026-07-09

## Policy

Legacy tasks are preserved under a dedicated legacy Taskmaster tag. Their old statuses describe historical CLI state, not current product authority. The canonical tag contains Task 33 and the new foundation roadmap. No legacy task is silently rewritten into a new requirement.

Classifications:

- **keep:** outcome remains valid with minor clarification;
- **revise:** outcome remains useful but scope/acceptance/technology must change;
- **historical-done:** repository evidence shows the old setup work happened, though it may now be replaced;
- **defer:** not part of the current foundation or needs later product evidence;
- **cancel:** obsolete product capability;
- **supersede:** replaced by a new canonical task or architecture.

## Disposition

| ID | Legacy title | Old status | Classification | Reason / canonical destination |
| --- | --- | --- | --- | --- |
| 1 | Initialize Project Repository and Development Environment | pending | historical-done | Repository/workspace exists; reproducibility is replaced by baseline and runtime tasks. |
| 2 | Configure Next.js 14 with App Router and TypeScript | done | historical-done | Prototype exists; framework modernization replaces the obsolete version target. |
| 3 | Integrate Tailwind CSS and Design System Foundation | done | historical-done | Tailwind/themes exist; visual system requires product-led modernization. |
| 4 | Install and Configure shadcn/ui Component Library | done | historical-done | Copied Radix components exist; app-local shadcn/Base UI audit supersedes configuration work. |
| 5 | Configure MDX Processing Pipeline | pending | supersede | Canonical content becomes versioned structured JSON in PostgreSQL. |
| 6 | Implement Content File Structure and Organization | pending | supersede | Database entities, revisions, media, and export replace repository content folders. |
| 7 | Build Core Layout Components | pending | revise | Premium magazine and owner shells remain needed under new design acceptance criteria. |
| 8 | Develop Homepage with Content Listing | pending | revise | Replace animal/demo homepage with art-directed magazine landing task. |
| 9 | Create Blog Post Detail Page with MDX Rendering | pending | revise | Article route remains, but uses safe structured-document rendering rather than MDX. |
| 10 | Implement Content Classification System | pending | cancel | Animal trauma/sensitivity taxonomy is not a current product requirement. |
| 11 | Configure Image Optimization and Gallery Components | pending | revise | Expand to owner media originals, metadata, focal points, responsive delivery, backup, and restore. |
| 12 | Build SEO Foundation with Meta Tags and Structured Data | pending | revise | Retain outcome with canonical URLs, redirects, article/author/breadcrumb data, social cards, and draft protection. |
| 13 | Implement Search Functionality | pending | revise | Start with PostgreSQL full-text/trigram search and measured relevance. |
| 14 | Create Newsletter Signup Integration | pending | revise | App owns consent/subscribers; delivery provider is replaceable. |
| 15 | Build Donation Integration Components | pending | cancel | Donation workflow belongs to the superseded animal-foundation product. |
| 16 | Develop Impact Metrics Dashboard | pending | cancel | Foundation impact dashboard is obsolete; editorial analytics is a separate revised capability. |
| 17 | Implement Social Sharing Optimization | pending | revise | Keep social metadata/cards; avoid intrusive share UI by default. |
| 18 | Configure Analytics and Performance Monitoring | pending | revise | Use privacy-conscious analytics, Web Vitals, OTel server evidence, and explicit budgets. |
| 19 | Build Content Management Workflow | pending | supersede | Owner-operated drafts/autosave/revisions/preview/scheduling/export replaces Git workflow. |
| 20 | Implement Error Handling and Fallback Pages | pending | keep | Still required; extend to owner recovery and asynchronous partial failures. |
| 21 | Configure Security Headers and CSP | pending | revise | Remove unsafe prototype allowances and cover editor/media/embed/preview threat model. |
| 22 | Build Comment System Integration | pending | defer | Comments are not a binding initial requirement; reconsider after readership/moderation evidence. |
| 23 | Implement RSS Feed Generation | pending | keep | RSS remains a canonical reader/distribution requirement. |
| 24 | Create Related Content Recommendation System | pending | revise | Use transparent taxonomy/editorial signals before opaque recommendation services. |
| 25 | Implement Accessibility Compliance Features | pending | revise | Accessibility is cross-cutting WCAG 2.2 AA acceptance, not a late feature task. |
| 26 | Configure Vercel Deployment Pipeline | pending | revise | Vercel is provisional; require CI, isolated environments, migrations, Node fallback, and rollback. |
| 27 | Build Performance Optimization Pipeline | pending | revise | Establish budgets and p75 LCP/INP/CLS gates throughout delivery. |
| 28 | Create Content Creator Documentation | pending | supersede | The owner should not follow technical publishing docs; replace with in-product guidance and operational maintainer docs. |
| 29 | Implement Emergency Appeal System | pending | cancel | Obsolete animal-foundation capability. |
| 30 | Conduct Final Testing and Launch Preparation | pending | supersede | Replace with phased production-readiness, restore, accessibility, security, and deployment gates. |
| 31 | Create Modern Blog Mockup Page with Cutting-Edge 2024-2025 Design Trends | pending | supersede | Replace trend-demo page with 2026 product vision, art direction, and representative visual acceptance tasks. |
| 32 | Implement Total Workflow Excellence System (TWES) for AI-Assisted Development | in-progress | defer | Preserve as governance/dogfood history outside product delivery; do not close or normalize in Task 33. |
| 33 | Establish SOTA 2026 Magazine Foundation | in-progress | keep | Canonical umbrella task for this long-running foundation program. |

## Dependency Audit

The legacy graph is syntactically connected but semantically stale. Task 8 depends on Task 31's trend mockup, animal-specific tasks feed launch Task 30, and Git/MDX tasks underpin content features. Those dependencies must not be copied into the canonical program.

The new canonical graph uses outcome phases: truth and architecture, Taskmaster reconciliation, baseline, runtime/tooling/framework/design-system modernization, spikes, content platform, owner publishing, reader foundation, distribution, and production readiness.

## Generated Task Files

Supported CLI generation was run for both tags. The exact legacy root-level `task_001.txt` through `task_032.txt` projections remain preserved to avoid format-only churn, while canonical Task 33/34-47 projections use the current `.md` generator format under `.taskmaster/tasks/`. The `tasks.json` tag arrays remain authoritative and both dependency graphs validate. Do not manually edit `tasks.json` or treat generated files as independent authority.
