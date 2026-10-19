# SEO and distribution code map

Snapshot: Task 54 starting commit `efd9166e3e73c485991df47c5ca02693f4d3246e`.
Re-read affected files at the reviewed revision; report drift rather than repeating this
snapshot. The Phase 5 plan is design evidence, not proof of a running feature.

## Existing surfaces

| Source | Observed behavior and review implication |
| --- | --- |
| `packages/web/src/lib/site-url.ts` | resolveCanonicalSiteUrl reads NEXT_PUBLIC_SITE_URL; resolveRuntimeSiteUrl reads MAGAZINE_RUNTIME_SITE_URL. Both use resolveSiteUrl, which rejects credentials, query, fragment and non-root paths. Production rejects non-HTTPS origins except HTTP loopback; invalid configuration falls back to unconfigured.magazine.invalid in production and localhost:3000 otherwise. These are fallbacks, not accepted public launch origins. |
| `packages/web/src/lib/site-url.test.ts` | Tests allowed origins, fallbacks and the separation of build-time canonical and runtime origins. Passing this test does not prove rendered page canonicals or redirect responses. |
| `packages/web/src/app/layout.tsx` | Sets metadataBase with resolveCanonicalSiteUrl, root canonical `/`, description, title template and website Open Graph metadata. |
| `packages/web/src/app/page.tsx` | Loads the published home view and renders the selected direction; it has no separate metadata export and uses the root metadata. |
| `packages/web/src/app/stories/[slug]/page.tsx` | Normalizes the slug, loads an article view, returns empty metadata when unavailable and calls notFound in the page. Available views supply canonical href, title, dek, authors, article Open Graph URL and publishedTime, plus hero image metadata when present. No public redirect lookup or JSON-LD emission appears here. |
| `packages/web/src/app/sections/[slug]/page.tsx` | Emits canonical href, section title, description fallback and website Open Graph URL; absent views call notFound. |
| `packages/web/src/reader/read-model.ts` | Published revision supplies title and summary; href uses the current article slug, authors are empty, and section description is null. Do not infer real bylines from the metadata mapping. |
| `packages/web/src/server/content/service.ts` | changeSlug validates expected version and slug, saves a SlugRedirect and updated article in a transaction, records a publication change and audits article.slug-changed. The audit entry is not an outbox event; this method has no saveOutbox call. Stored redirects do not prove public redirect resolution. |
| `packages/web/public/robots.txt` | Static User-agent `*` and empty Disallow; it contains no sitemap declaration or private-route exclusions. Do not describe the planned robots policy as shipped. |
| `packages/web/src/app/preview/stories/[slug]/page.tsx` | Has robots metadata for preview. Inspect route authorization separately; metadata is not an access-control test. |
| `packages/web/next.config.ts` | Defines X-Robots-Tag for sensitive route patterns alongside other security headers. Inspect the exact matchers and response before claiming a route is excluded. The static robots file is a separate layer. |

## Planned surfaces and ownership

`docs/planning/phase-5/decomposition-r2.md` records the intended slices. The bead IDs below
come from the Task 54 contract; confirm their current delivery status in Beads when that
access is available. None of these planned paths exists at the snapshot. Path routing is
an advisory preparation for future changes, not an assertion of implementation.

| Status | Path or capability | Accepted-work reference and intent |
| --- | --- | --- |
| Planned | `packages/web/src/server/distribution/canonical.ts` | blog-0045.3: common canonical URL construction and slug-resolution work; chained redirects to the current slug, explicit unknown/gone behavior and a deployment-runtime spike. |
| Planned | `packages/web/src/app/feed.xml/route.ts` | blog-0045.5: RSS 2.0; Atom is conditional in the plan, not a promised existing endpoint. |
| Planned | `packages/web/src/app/sitemap.xml/route.ts` | blog-0045.5: sitemap index from published content. |
| Planned | `packages/web/src/app/sitemaps/[page]/route.ts` | blog-0045.5: paginated sitemap output. |
| Planned | `packages/web/src/app/robots.txt/route.ts` | blog-0045.5: robots and index hygiene; reconcile with the existing static robots file. |
| Planned | schema.org JSON-LD | blog-0045.6: server-rendered structured data from publication facts and canonical URLs. |
| Planned | Generated social cards | blog-0045.8: generated image and distribution work beyond today's hero Open Graph metadata. |
| Planned | Search query and event integration | blog-0045.1 and blog-0045.2: query adapter and outbox processing. Existing search.upsert event production is not evidence of a complete search service or UI. |
| Planned | Newsletter and subscriber integration | blog-0045.9 and blog-0045.10: subscriber/consent storage and delivery adapters; do not claim a working subscription/send flow from the plan. |

## Verification and routing

Use existing scoped checks when execution is authorized:

```sh
corepack pnpm exec vitest run packages/web/src/lib/site-url.test.ts
```

For a new feed, sitemap, redirect or structured-data implementation, first locate its actual
tests. State proposed parser and HTTP assertions explicitly if those tests do not exist;
do not present hypothetical commands as executed checks. A source review alone cannot
prove rendered HTTP status, crawler indexing, social-platform cache refresh or ranking.

Metadata files overlap `reader-frontend`: this skill owns URL/discovery semantics, that skill
owns reader layout and performance. Future server/distribution files overlap
`content-platform-backend` for storage and event consistency. No route here selects every
reader component, owner page or server file. Security and release checks are handoffs even
when their paths do not trigger this skill automatically.
