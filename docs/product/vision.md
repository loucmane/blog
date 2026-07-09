# Product Vision

**Status:** Canonical

**Updated:** 2026-07-09

## Vision

Create a top-tier editorial magazine that feels crafted to readers and uncomplicated to its owner. The public product should have the authority, typography, art direction, and performance of a leading digital publication. The private product should turn publishing into a calm, recoverable browser workflow for a person who does not use developer tools.

## Problem

The stale prototype assumes content is written as Markdown, committed to Git, and deployed by technical tooling. That workflow excludes the intended owner and makes portability synonymous with repository access. It also couples the product to obsolete animal-foundation requirements and a demo-oriented design system.

Traditional hosted CMS products solve authoring but add a separate content control plane, provider-specific schemas, and migration risk. This product instead owns the editorial workflow and data model while using replaceable infrastructure services underneath.

## Product Promise

### To the owner

- Write and arrange a story in a familiar visual editor.
- Trust that work saves automatically and can be recovered.
- Preview exactly what readers will see.
- Schedule, publish, update, or unpublish without asking a developer.
- Manage images, metadata, sections, tags, authors, and social presentation in one place.
- Export the publication and media in documented, usable formats.

### To readers

- Read a distinctive, responsive publication with premium typography.
- Discover stories through sections, authors, taxonomy, related content, search, feeds, newsletters, and social links.
- Receive stable URLs, accurate metadata, responsive media, and respectful privacy.
- Use the publication with keyboard, screen reader, zoom, reduced motion, or constrained devices.

### To maintainers

- Work from explicit contracts and versioned schemas.
- Upgrade in reviewable, reversible batches.
- Diagnose publishing and delivery failures with useful evidence.
- Move data or hosting without reconstructing the publication from a vendor's private representation.

## Experience Principles

1. **Calm ownership:** explain state and recovery in editorial language.
2. **Structured freedom:** give the owner expressive blocks inside safe editorial constraints.
3. **Art-directed consistency:** support deliberate layout variation without becoming a generic page builder.
4. **Progressive disclosure:** keep common publishing simple and advanced controls available when needed.
5. **Trustworthy state:** never make the owner guess whether work is saved, scheduled, public, or recoverable.
6. **Readable by default:** typography, contrast, hierarchy, and media behavior are product features.
7. **Portable by design:** canonical data and originals remain independently exportable and restorable.

## Initial Scope

The first operational product optimizes for one owner and one publication. It includes a public magazine, private editorial workspace, structured articles, media library, revisions, scheduling, taxonomy, search, SEO, newsletter capture, analytics, observability, backups, restore, and export/import.

The architecture must allow later contributors and review roles without requiring them in the first increment.

## Non-Goals

- A general-purpose website builder.
- A hosted CMS product for third parties.
- A full digital-asset-management suite.
- Real-time multiplayer editing in the first increment.
- A social network, comment community, donation platform, or animal-rescue workflow.
- Normal publishing through Git, raw Markdown, deployment commands, or hosting dashboards.
- Completion of the whole magazine during Task 33; this program delivers the validated modern foundation.

## Success Signals

- A first-time owner can publish a validated article without technical help.
- Autosave and revision recovery prevent ordinary data loss.
- Export and restore are demonstrated, not merely documented.
- Public templates meet WCAG 2.2 AA and p75 Core Web Vitals targets.
- Reader pages contain no editor runtime unless editing is active.
- Provider replacement can occur through documented adapters and data migration rather than product redesign.
