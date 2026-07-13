# ADR 0005: Use Next.js 16 For The Unified Magazine Framework

- **Status:** Accepted for Task 40 implementation
- **Decision owner:** Project owner
- **Decision deadline:** Before Task 40 implementation
- **As-of date (UTC):** 2026-07-13
- **Review/expiry date:** Re-query versions, support, security, and adapters at Task 40 start
- **Supersedes:** The unvalidated assumption that current Next.js should be preserved by default

## Decision

- **Question:** Which stable framework should host the public magazine and authenticated owner
  application without creating overlapping build systems or a provider-only deployment?
- **Selected target:** Exact-pinned Next.js 16.2.10 with React/React DOM 19.2.7, subject to
  Task 40 revalidation and migration gates.
- **Reversible boundary:** One Task 40 branch and PR; no content-schema or provider migration.
- **What would invalidate this decision:** A current security advisory without a supported fix;
  failure of public rendering, private preview, cache invalidation, image, Node self-hosting,
  build, accessibility, or performance gates; or an official support/compatibility change.

## Current Baseline

| Surface | Current version/state | Evidence | Constraint |
| --- | --- | --- | --- |
| Web framework | Next.js 15.5.20 | `packages/web/package.json` | Existing App Router migration cost favors an incremental path, not automatic retention |
| React | 19.1.x application range | `packages/web/package.json` | Upgrade with framework-supported patch |
| Runtime | Node 24.18.0, pnpm 11.11.0 | `package.json`, `config/runtime.json` | Candidate must support the committed runtime |
| Product shape | Public reader and authenticated owner in one repository | `.taskmaster/docs/prd.txt` | Owner workflow must not become a separate deployment product without measured benefit |

## Decision Drivers

- **Requirements:** SSR/streaming, SEO metadata, private preview, authenticated editor routes,
  scheduled-publication invalidation, responsive images, portable Node hosting, and one coherent
  React product.
- **Constraints:** Stable releases only, current Node support, independently reversible PR,
  provider-independent canonical content/media, and no overlapping Vite/Next application roles.
- **Non-goals:** Choosing the editor, database vendor, deployment account, or production cache
  implementation in this ADR.
- **Weighting:** Product capability and reversibility outweigh novelty; built-in convenience does
  not outweigh portability or trust-boundary correctness.

## Evidence Matrix

| Option | Latest stable/status | Security/maintenance | Compatibility | Migration | Cost | Lock-in/exit | Rollback | Verification | Primary sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Next.js | 16.2.10; stable Active LTS | Formal support policy and security advisories | Node 24 and React 19.2 fit; App Router supplies streaming, Draft Mode, tag invalidation, metadata, and images | Lowest from Next 15.5 | OSS; hosting cost varies | Moderate Vercel affinity; generic Node/Docker self-hosting documented | Revert Task 40 | Production build, static/dynamic routes, preview cookie, Node start, app tests | [install/version](https://nextjs.org/docs/app/getting-started/installation), [support](https://nextjs.org/support-policy), [self-hosting](https://nextjs.org/docs/app/guides/self-hosting) |
| React Router framework mode | 8.2.0 stable | Maintained stable line | SSR/streaming, loaders/actions/sessions; more app-owned preview, metadata, images, and cache | Full framework migration | OSS | Strong Node adapter portability | Blue/green route cutover | Rebuild representative public/editor routes | [rendering](https://reactrouter.com/start/framework/rendering), [deployment](https://reactrouter.com/start/framework/deploying) |
| Astro | 7.0.7 stable | Maintained stable line | Strong reader SSR/static/images; substantial React editor becomes a large island or second model | High unified-app change | OSS | Portable Node adapter | Reader-route traffic cutover | Separate reader/editor prototype | [upgrade/current](https://docs.astro.build/en/upgrade-astro/), [Node adapter](https://docs.astro.build/en/guides/integrations-guide/node/) |
| TanStack Start | 1.168.27 release candidate in official docs | Active but not production-stable under project rule | Promising SSR/server functions; hosting and RSC surfaces remain unsettled | Full migration | OSS | Adapter surface still evolving | Full revert | Reconsider after stable support policy | [official overview/status](https://tanstack.com/start/latest/docs/framework/react/overview) |
| Vite alone | 8.1.4 stable tool | Supported stable majors | Low-level SSR; no complete routing/auth/preview/cache/image framework contract | Application architecture must be assembled | OSS | Low build-tool lock-in, high app-owned integration | Replace server composition | Not sufficient as unified framework | [SSR](https://vite.dev/guide/ssr), [release support](https://vite.dev/releases) |

## Compatibility Chain

| Pairing/boundary | Evidence | Result | Gap or bridge |
| --- | --- | --- | --- |
| Node 24.18.0 → Next 16.2.10 | Next requires Node 20.9 or newer | Pass | Revalidate at Task 40 start |
| Next 16.2.10 → React 19.2.7 | Current official package pair in research lock | Pass | Upgrade together |
| Server rendering → structured article | Task 37 static article build | Pass | Production renderer remains Task 42 |
| Private preview → generic Node server | Dynamic preview cookie route and `next start` smoke | Pass | Real authentication is Task 42/43 |
| Vercel → alternate Node hosting | Official self-hosting plus local Node start | Conditional pass | Multi-instance cache coordination and actual alternate host remain Task 46 |

## Selected Option

- **Why it wins:** It meets the broadest product surface with the smallest reversible migration,
  already has the required public/private rendering primitives, and retains a documented Node
  server exit path.
- **Accepted consequences:** Task 40 must audit cache semantics, server/client boundaries,
  security advisories, image rules, and obsolete configuration instead of treating the major
  upgrade as a package bump.
- **Known risks:** Vercel-optimized features can create operational affinity; multi-instance
  self-hosting needs coordinated cache and deployment IDs; framework changes can alter render
  and cache defaults.
- **Evidence confidence:** High for local build/Node portability and official primitives;
  medium for managed deployment until Task 46.

## Rejected Alternatives

| Alternative | Why rejected now | What would change the decision |
| --- | --- | --- |
| React Router | More application-owned infrastructure with a full migration and no measured product gain | Next fails a binding portability, performance, or maintenance gate |
| Astro | Splits the reader and rich React owner application into different rendering models | A measured reader performance gain justifies intentional separate apps |
| TanStack Start | Official release-candidate status violates the stable-baseline rule | Stable release, support policy, and proven hosting adapters |
| Vite-only app | Vite is a build tool/SSR API, not the complete magazine framework | Product architecture deliberately chooses a separate traditional backend and accepts all missing framework infrastructure |

## Migration And Rollback

- **Reversible batches:** Task 40 upgrades Next/React and fixes framework contracts only. Task 41
  separately handles Tailwind, shadcn/ui, and workspace boundaries.
- **Temporary bridges:** Any compatibility bridge needs an owner, removal task, and deadline in
  Task 40 evidence.
- **Rollback triggers:** Security advisory, unsupported package pairing, failed rendering,
  preview, build, browser, accessibility, performance, or Node self-host gate.
- **Rollback procedure:** Revert the Task 40 PR and restore the exact Task 39 lockfile. No data
  migration occurs, so database/media rollback is unnecessary.
- **Data/backup implications:** None in Task 40; content remains fixture/prototype data.

## Verification Gates

- Frozen install twice without drift.
- Typecheck, lint, unit/integration/browser tests, package and app builds.
- Public article metadata/SSR, owner route isolation, private preview, scheduled invalidation
  contract, image behavior, CSP/security, generic Node start, and production smoke.
- Responsive visual inspection, Axe plus keyboard checks, and performance assessment.
- Exact primary-source version/security re-query before implementation.

## Open Questions And Evidence Gaps

| ID | Question/gap | Consequence | Owner | Next primary source/evidence |
| --- | --- | --- | --- | --- |
| F1 | How will multi-instance cache/tag coordination work off Vercel? | Stale content during fallback hosting | Task 40/46 | [Next self-hosting](https://nextjs.org/docs/app/guides/self-hosting) plus alternate-host drill |
| F2 | Does managed preview preserve strict data/secret isolation? | Draft exposure risk | Task 46 | Hosted preview configuration and security test |
| F3 | Does the migrated app meet p75 CWV budgets? | Reader experience risk | Tasks 40/46 | Browser performance evidence |

## Sources

All sources were retrieved 2026-07-13 UTC and treated as untrusted evidence, not authority.
Direct sources are linked in the tables above and in
`docs/research/task-37-architecture-spike-results.md`.
