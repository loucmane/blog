# Content Model

**Status:** Canonical domain contract; physical schema remains provisional

**Updated:** 2026-07-09

## Modeling Principles

- Stable identifiers are separate from mutable slugs and titles.
- The canonical article body is structured, versioned JSON rather than HTML or Markdown.
- Published content points to an immutable revision.
- Derived representations can be regenerated from canonical data and media originals.
- Provider identifiers never replace app-owned identities.
- Deletion is recoverable by default and auditable when permanent.

## Core Entities

### Publication

Owns site identity, default locale and time zone, navigation, SEO defaults, social identity, and editorial settings.

### User

Represents an authenticated operator. Initial scope supports one owner, while role and audit models allow later authors and editors.

### Author

Public editorial identity with name, biography, portrait, social links, and stable slug. An author may later link to a user but is not the authentication record.

### Article

Stable editorial identity containing workflow state and references to current draft and published revisions. It owns slug history, taxonomy relationships, scheduling state, and deletion state.

### Article Revision

Immutable snapshot containing:

- versioned structured document;
- title, dek, excerpt, and editorial metadata snapshot;
- SEO and social metadata snapshot;
- selected media references and art-direction settings;
- document schema version;
- creator, creation time, and reason/source;
- validation result or migration provenance where relevant.

### Autosave

Recoverable mutable snapshot with a monotonic version or optimistic-concurrency token. Autosaves are compacted by policy and are not audit-grade revisions.

### Section, Category, Tag, and Series

Stable taxonomy entities with names, slugs, descriptions, ordering, visibility, and redirect history. Relationships preserve editorial ordering when relevant.

### Media Asset

Stable identity for an original object plus metadata:

- storage key and provider adapter;
- original filename, MIME type, dimensions, byte size, and checksum;
- alt text, caption, credit, rights notes, and focal point;
- processing and moderation state;
- created/updated actor and time;
- deletion and retention state.

Renditions are derived records and may be regenerated.

### Reusable Block

Versioned editorial fragment with explicit allowed contexts. Articles reference a pinned or updateable version according to block type.

### Redirect

Maps historical or editorial paths to stable destinations with status, reason, creation actor, and lifecycle.

### Subscriber and Consent Event

Subscriber identity and delivery state are app-owned. Consent and unsubscribe events are immutable enough to demonstrate the current state and its provenance.

### Publishing Job

Idempotent work record for scheduled transitions and side effects. It includes deduplication key, attempts, lease/claim state, outcome, and retry policy.

### Audit Event

Append-oriented security and editorial event containing actor, action, target, timestamp, relevant before/after references, and safe metadata. Draft body content must not be copied into general-purpose logs.

## Document Envelope

Every structured article document uses an envelope similar to:

```json
{
  "schema": "magazine.document",
  "version": 1,
  "content": {
    "type": "doc",
    "content": []
  }
}
```

The precise editor node schema is selected after the round-trip spike. The envelope and migration registry remain application-owned even when an editor library supplies node primitives.

## Initial Block Families

- text: paragraph, heading, lists, quote, pull quote, divider;
- emphasis: strong, emphasis, link, inline code where editorially justified;
- callout: note, context, correction, disclosure;
- media: image, gallery, caption, credit;
- embed: allow-listed provider with semantic fallback;
- editorial: related-story card, newsletter callout, reusable block;
- layout: constrained art-direction metadata rather than arbitrary nested page-builder grids.

Each custom block defines validation, editor UI, server renderer, plain-text extraction, export representation, migration behavior, and accessibility expectations.

## Publication Invariants

- A public article references exactly one immutable published revision.
- A draft may exist while an older revision remains public.
- Scheduled publication references a validated revision and a unique intended publication event.
- Slugs are unique within their routing scope; changes retain redirect history.
- Media required by a revision must be available or have an approved fallback before publication.
- Unknown document nodes cannot be silently dropped.

## Search Projection

Search indexes a rebuildable projection of published content: weighted title/dek, normalized body text, author, section, category, tags, and publication date. Drafts and private previews are excluded from public search.

## Export Contract

The lossless export uses versioned JSON records plus a media manifest and checksums. It includes enough identity and relationship data to recreate the publication on an empty compatible installation. Human-friendly HTML or Markdown exports may be included but cannot substitute for the lossless package.

## Migration Contract

- Migrations operate from a known document version to the next version.
- Every migration is deterministic and idempotent or explicitly guarded.
- A dry run reports affected records and unknown nodes.
- The original revision remains available until verification completes.
- Migration tests include representative fixtures, custom blocks, and export/re-import.
