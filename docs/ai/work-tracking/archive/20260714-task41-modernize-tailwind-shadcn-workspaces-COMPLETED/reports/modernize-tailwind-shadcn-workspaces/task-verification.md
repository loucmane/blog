# Task 41 Verification

## Scope

Task 41 owns the Tailwind, app-local component, and workspace-boundary migration. It does not change GitHub workflows, Aegis runtime or authority, secrets, deployment, content persistence, or Task 42+ product behavior. The owner-authorized managed Aegis rollout and `.codex/` remain pre-existing, unstaged infrastructure state.

## Selected Stack

| Surface | Selected stable version | Evidence and rationale |
| --- | --- | --- |
| Tailwind CSS | `4.3.2` | Current stable CSS-first line from the official Tailwind 4.3 release and package registry. |
| Tailwind PostCSS | `4.3.2` | Exact version alignment with Tailwind CSS. |
| Tailwind Typography | `0.5.20` | Stable official plugin for future editorial prose. |
| Base UI | `1.6.0` | Stable shadcn-default primitive foundation, adopted only for the representative theme menu. |
| next-themes | `0.4.6` | Stable system/light/dark preference and hydration-safe class ownership. |
| tailwind-merge | `3.6.0` | Stable Tailwind 4-aware class conflict resolution. |
| tw-animate-css | `1.4.0` | Stable Tailwind 4 animation utility source. |
| lucide-react | `1.24.0` | Stable project-owned icon dependency. |

Primary sources: <https://tailwindcss.com/blog/tailwindcss-v4-3>, <https://tailwindcss.com/docs/upgrade-guide>, <https://ui.shadcn.com/docs/changelog>, <https://base-ui.com/react/overview/releases>, and exact official registry metadata queried on 2026-07-14.

## Migration Evidence

- Workspace importers: `package.json` and `packages/web/package.json` only.
- Lockfile delta: 55 additions and 497 removals, reflecting the selected styling chain and removal of obsolete UI/backend build graphs.
- Two consecutive `pnpm install --frozen-lockfile` runs completed with identical package, workspace, and lockfile hashes.
- Runtime contract passed with Node `24.18.0`, pnpm `11.11.0`, Corepack `0.35.0`; all 13 adversarial contracts passed.
- Typecheck, ESLint, Prettier, 61 unit/integration tests, and coverage passed. Coverage: 93.03% statements, 91.86% branches, 93.93% functions, 93.42% lines.
- Next production build and production HTTP smoke passed.
- Playwright passed 18/18 desktop/mobile checks, including the axe baseline, keyboard theme selection and persistence, forced-colors focus treatment, and reduced-motion behavior.
- Quality contracts passed 29/29; security-hotfix contracts passed 7/7; controlled auto-merge policy passed 65/65 and workflow contracts passed 46/46.
- Cross-agent skill platform passed 29/29; Taskmaster repository health passed with 36 tasks and 76 dependencies; dependency audit reported zero advisories.
- Taskmaster's supported health helper and full `validate-dependencies` both passed; `.taskmaster/state.json` had the same SHA-256 before and after validation.
- `actionlint` `1.7.12` passed every unchanged workflow; its inspected binary SHA-256 was `c872d6db8c6bf83a8eaa704fc93999f027d55dffbc63b8a6abdccb47df5f4cd4`.
- Gitleaks `8.30.1` scanned 62 explicit Task 41 files in an isolated `/tmp` tree and found no leaks. The scan never traversed `.codex/` or unrelated untracked infrastructure.
- Final strict Aegis verification passed 42 checks with zero required failures. Enforcement remained advisory; at verification time the queue classification was `advisory_only` with 316 advisory, zero required, and zero unknown events.
- Scoped Aegis witness passed after external-ledger access, recorded boundary event `6230052eef944875a56c40074cc61b63`, and projected the passive-ledger evidence into legacy surfaces.
- `git diff --check` passed. Complete tracked-path classification found zero unknown files: all paths were either Task 41 scope or the explicitly preserved managed rollout.
- Desktop and 390×844 mobile production screenshots were inspected in light and dark palettes with no clipping, overflow, hierarchy, or contrast regression observed.
- The first focused browser rerun caught two test-timing defects rather than a product-color defect: axe scanned the Base UI popup during its entrance-opacity transition, and the mobile forced-colors case attempted keyboard entry before hydration enabled the trigger. The tests now wait on actual popup transition state and trigger readiness; the focused 4/4 and complete 18/18 suites pass without suppressing axe rules.
- Two independent read-only reviews identified hidden backend residue, incomplete real-keyboard/open-menu/persistence proof, incomplete forced-colors/reduced-motion browser proof, stale package documentation, and premature ADR acceptance. The implementation removed `packages/backend/.babelrc`, strengthened unit and Playwright journeys, refreshed current-facing documentation, and kept ADR 0005 proposed until closeout.
- The adversarial re-review then found that the new forced-colors/reduced-motion journey was not yet a required CI capability and that six legacy guidance files still looked current. The critical-journey inventory now requires that browser journey in both capability and result contracts with removal-denial tests; each legacy guide carries an explicit superseded/non-authoritative notice pointing to canonical sources, including a prohibition on its unsafe broad-staging instructions.
- Final staged package-script comparison proved `packages/web/package.json` scripts are unchanged. Root scripts intentionally remove only the deleted `@minniewinnie/ui` type-build prefix from `typecheck`; no other root script changes. This is required by the workspace removal and correctly forces attended merge review under the trusted delivery policy.

## Aegis Dogfood

After strict verification passed, `aegis log` rejected the new verification event because the advisory-only pending queue exists. The managed advisory contract says these events are preserved audit evidence and require no reconciliation. No event was consumed, rewritten, or drained. Task 41 records this ordering/reconciliation defect without weakening verification or mutating the queue.

## Delivery Gates

- Aegis closeout passed with zero required failures and zero warnings; Taskmaster Task 41 is `done`, and the completed archive passes legacy guard validation.
- Commit and push only the explicit Task 41 allowlist, require hosted protected CI, and stop at attended merge review because the root package-script object intentionally changed.

## Independent Review

- The implementation/completeness reviewer reported no remaining critical, high, or medium findings after remediation and confirmed 61/61 unit plus 18/18 browser results.
- The adversarial accessibility/security/authority reviewer confirmed both final medium findings were resolved, the third critical browser journey is deletion-resistant, all six legacy guides are explicitly non-authoritative, and the complete diff is merge-ready from read-only review.

## Rollback

Revert the Task 41 commit as one unit. That restores the previous package graph, lockfile, standalone UI/backend/shared scaffolds, theme implementation, routes, aliases, and deterministic projections without touching Task 40 framework behavior or the pre-existing managed Aegis rollout.
