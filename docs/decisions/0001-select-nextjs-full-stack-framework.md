# ADR 0001: Select Next.js as the Provisional Full-Stack Framework

**Status:** Proposed; acceptance requires framework and deployment verification

**Date:** 2026-07-09

**Task:** 33

## Context

The product needs a premium public magazine and a protected owner workspace with SSR/streaming, metadata, previews, scheduling, cache invalidation, image handling, and server mutations. The repository already contains a Next.js App Router prototype, but the old architecture is not authoritative.

Current stable alternatives include Next.js 16.2, React Router 8 framework mode, Astro 7, Vite 8.1 as a build tool, and TanStack Start. TanStack Start's official site still labels the product release-candidate software. A separate public and admin framework would increase routing, data, deployment, and design-system boundaries before scale requires them.

## Decision

Provisionally standardize on one Next.js 16.2 full-stack application for public reader routes and protected owner routes.

- Use server rendering and caching appropriate to each reader route.
- Keep editor and administrative code out of public article bundles.
- Use protected draft preview and explicit cache/search/feed invalidation.
- Keep domain and provider boundaries independent of Next route handlers.
- Prove a managed Vercel deployment and a documented Node-compatible deployment.
- Do not add Vite as a parallel application tool. Vitest may use Vite internals for tests.

## Rationale

- Lowest migration risk from the current repository.
- Strong built-in fit for metadata, images, preview, server rendering, route protection, and revalidation.
- One application reduces duplicated auth, routing, types, styles, and deployment.
- Next.js now documents adapter testing and self-hosting, giving measurable portability rather than assuming Vercel is the only host. See [Next.js 16.2](https://nextjs.org/blog/next-16-2), [platform adapters](https://nextjs.org/blog/nextjs-across-platforms), and [self-hosting](https://nextjs.org/docs/app/guides/self-hosting).

## Alternatives

- **React Router framework mode:** credible and portable, but requires more custom platform work without a current product advantage.
- **Astro:** excellent public content rendering, but a substantial React owner workspace creates a hybrid or second app.
- **TanStack Start:** promising but official RC status violates the stable-baseline mandate. [Official status](https://tanstack.com/start/latest)
- **Plain Vite:** a build tool rather than the complete server product contract.

## Consequences

- The framework migration must remove obsolete Next config rather than carry legacy rewrites, aliases, CSP exceptions, or removed commands.
- Vercel-specific features require an adapter/fallback analysis.
- Framework security patches are operationally important because server components span server and client boundaries.
- A future framework switch remains substantial, so domain, document, database, and service contracts must not live only in route files.

## Acceptance Gates

1. Frozen install, typecheck, lint, tests, and production build on the selected runtime.
2. Public article SSR/streaming and metadata fixture.
3. Protected draft preview with expiry and `noindex` behavior.
4. On-demand invalidation for publish/update/unpublish.
5. Responsive image behavior and restrictive CSP.
6. Vercel preview plus Node-hosted production start or container proof.
7. No editor bundle on reader article route.

## Rollback

Keep the framework migration in its own pull request. Revert that pull request to restore the recorded pre-upgrade Next 15 baseline. If acceptance fails before merge, close the migration PR and run a scoped React Router or Astro spike without retaining parallel production code.
