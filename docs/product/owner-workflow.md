# Owner Editorial Workflow

**Status:** Canonical behavior contract

**Updated:** 2026-07-09

## Design Assumption

The owner is comfortable with common consumer web applications but must not need Git, Markdown, terminals, database tools, deployment tools, or hosting-console knowledge. All normal publishing actions happen inside the application.

## Content States

| State | Meaning | Publicly visible |
| --- | --- | --- |
| Draft | Editable work not approved for publication | No |
| Scheduled | Validated version queued for a future instant | No until due |
| Published | Current public revision | Yes |
| Unpublished | Previously public content intentionally withdrawn | No, redirect policy applies |
| Trashed | Soft-deleted and recoverable | No |

Autosaves and immutable revisions are not publication states. They are recovery records associated with an article.

## Create and Edit

1. Owner signs in and chooses **New story** or a controlled editorial template.
2. The application creates a server-side draft immediately.
3. The editor autosaves after meaningful changes and shows `Saving`, `Saved`, `Offline`, or `Recovery available`.
4. The owner builds the story from supported blocks and completes editorial metadata.
5. Validation identifies missing or problematic fields without discarding work.
6. Explicit revisions are recorded at key milestones and before publication transitions.

The interface must remain usable if media processing or optional integrations are delayed. A temporary network failure must not silently discard typed content.

## Recovery

- Keep a recent client-side recovery buffer for unsent changes.
- Keep server-side autosaves separate from immutable revisions.
- On conflict, preserve both versions and explain the choice in plain language.
- Offer recovery after browser crash, expired session, transient network failure, or failed publish attempt.
- Never overwrite a newer server document without an explicit conflict decision.

## Preview

1. Owner chooses **Preview**.
2. The server issues an expiring, authorization-protected preview context.
3. Preview renders the selected draft revision through the same article renderer used publicly.
4. Preview carries a visible private-state banner and `noindex` protections.
5. Sharing, expiry, and revocation are explicit.

## Publish Now

1. Owner selects **Publish**.
2. The application validates content, metadata, media readiness, URL, and permissions.
3. The owner reviews a concise summary of warnings and the publication instant.
4. A transaction records the immutable publication revision and state transition.
5. Cache invalidation, feed updates, social-card generation, search indexing, and optional email work run idempotently.
6. The owner sees a stable success URL or an actionable partial-failure state.

Publishing the article must not be rolled back merely because an asynchronous newsletter or analytics action fails.

## Schedule

1. Owner chooses date, time, and a clearly displayed publication time zone.
2. The application stores the intended UTC instant plus the relevant display time-zone context.
3. A database-authoritative scheduler claims due work idempotently.
4. The same validation and transition rules as immediate publish apply.
5. Retries cannot publish twice or emit duplicate external side effects.
6. The owner can reschedule or cancel while the article remains unpublished.

## Update a Published Story

- Editing creates a new draft revision while the published revision remains public.
- Preview shows the proposed revision.
- Publishing the update atomically changes the public revision pointer.
- Prior public revisions remain in audit history and can be restored through a new revision.
- Slug changes create a permanent redirect from the prior canonical URL.

## Unpublish and Delete

- Unpublish is reversible and records actor, time, and reason.
- URL behavior is explicit: retain a controlled unavailable page or redirect where editorially appropriate.
- Trash is recoverable for a defined retention period.
- Permanent deletion requires confirmation, dependency checks, audit recording, and handling of referenced media.

## Media

1. Owner uploads or selects an asset.
2. The application validates type and size, stores the original, computes a checksum, and creates metadata.
3. Processing generates delivery renditions asynchronously.
4. Owner supplies alt text, caption, credit, rights notes, and focal point as applicable.
5. The editor previews responsive crops and failure fallbacks.
6. Published content references stable media identities, not ephemeral transformation URLs.

## Taxonomy and Reuse

- Authors, sections, categories, tags, series, and reusable editorial blocks are managed through dedicated, understandable screens.
- The application warns before merging or deleting values in use.
- Renames preserve stable identifiers and public redirects where needed.

## Export and Restore

- Owner can request a versioned export from the application.
- Large exports may finish asynchronously with visible progress and expiry.
- Export includes a manifest and checksums and never exposes secrets.
- Import validates schema, media integrity, ownership, collisions, and migration requirements before mutation.
- A dry-run summary is required before a destructive or merging import.

## Failure Language

Errors answer four questions:

1. What happened?
2. Is the owner's work safe?
3. What can the owner do now?
4. Does a maintainer need to intervene?

Raw stack traces, provider codes, SQL errors, and deployment terminology must not be the primary owner-facing message.
