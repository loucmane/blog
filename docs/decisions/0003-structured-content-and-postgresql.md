# ADR 0003: Use Versioned Structured Content in App-Owned PostgreSQL

**Status:** Proposed; blocked on editor, migration, and recovery spikes

**Date:** 2026-07-09

**Task:** 33

## Context

The nontechnical owner cannot publish through raw Markdown or Git. The product needs drafts, autosaves, immutable revisions, preview, scheduling, taxonomy, audit, export/import, custom blocks, and safe public rendering. File-backed MDX and repository automation make ordinary publishing a deployment workflow. SQLite is attractive for one writer but complicates the preferred managed/serverless deployment and durable write model.

## Decision

- Use PostgreSQL 18.4 as the canonical relational store.
- Use Drizzle ORM/Kit for typed schema and reviewable SQL migrations.
- Store article documents as versioned structured JSONB inside immutable revision records.
- Provisionally use Tiptap OSS 3.27 as the editing toolkit and ProseMirror document implementation.
- Own the document envelope, allowed nodes, schema migration registry, validation, renderer, plain-text extraction, and lossless export.
- Render structured nodes through allow-listed server components; stored HTML is never canonical or trusted.
- Use PostgreSQL full-text search, GIN, and `pg_trgm` before introducing an external search service.

## Rationale

PostgreSQL supplies transactions, constraints, JSONB, indexing, full-text search, backup tools, and broad provider support. Version 18 is supported through 2030. [Version policy](https://www.postgresql.org/support/versioning/), [JSONB](https://www.postgresql.org/docs/18/datatype-json.html), [text search](https://www.postgresql.org/docs/18/textsearch-indexes.html)

Tiptap exposes JSON persistence and static rendering while allowing custom nodes. [JSON persistence](https://tiptap.dev/docs/guides/output-json-html), [static rendering](https://tiptap.dev/docs/editor/api/utilities/static-renderer)

## Alternatives

- **File-backed MDX:** portable files but poor autosave, scheduling, conflict, and rich-block round-trip; rejected as canonical.
- **GitHub PR automation:** hides Git only on the happy path and makes every publication a code delivery; rejected for owner workflow.
- **SQLite:** retained for local tests/spikes, rejected as production target pending a stateful deployment decision.
- **BlockNote:** strong out-of-box Notion UX, but documented Markdown conversion is lossy and advanced licensing adds uncertainty. [Markdown export](https://www.blocknotejs.org/docs/features/export/markdown)
- **Lexical:** MIT and accessible foundations, but 0.x churn and more bespoke block/export UI.
- **Plate:** shadcn-aligned but a large, fast-moving abstraction surface.
- **External CMS:** violates the app-owned workflow and content-control requirement.

## Consequences

- Document migrations become first-class production code with fixtures and rollback evidence.
- Editor-library upgrades cannot silently rewrite or drop unknown nodes.
- Markdown/HTML are convenience exports only; versioned JSON plus media manifest is the lossless format.
- The data model must distinguish articles, immutable revisions, autosaves, published revision pointers, scheduling, media, redirects, and audit events.
- Database major upgrades need planned dump/restore or `pg_upgrade` procedures.

## Acceptance Gates

1. Representative document round-trips through editor JSON without semantic loss.
2. Headings, lists, quote, callout, image, gallery, captions, credits, focal points, embed fallback, and reusable block render server-side.
3. Unknown node and old-schema fixtures remain recoverable.
4. Migration runs twice safely and provides rollback/forward-repair evidence.
5. Autosave conflict and crash recovery preserve both sides.
6. Lossless export/re-import recreates identities and relationships.
7. PostgreSQL dump restores to local PostgreSQL and another compatible environment.
8. Search fixtures rank and filter published content while excluding drafts.

## Rollback

Do not add the editor or database to production dependencies until the spikes pass. If Tiptap fails, retain the application-owned document fixtures and evaluate Lexical/BlockNote against the same tests. If Drizzle fails, retain SQL/domain contracts and evaluate raw SQL or another migration layer. If PostgreSQL fails a binding requirement, reopen the architecture ADR before implementation.
