# Task ID: 64

**Title:** Permit Verification-Only Aegis Manifest Diffs in Autonomous Delivery

**Status:** done

**Dependencies:** 61 ✓, 62 ✓

**Priority:** high

**Description:** Permit autonomous delivery to accept .aegis/foundation-manifest.json only when a trusted semantic comparison proves the sole change is verification.last_verified_at, while every other Aegis manifest, runtime, authority, report, managed-asset, and enforcement change remains denied.

**Details:**

Extend the trusted auto-merge policy with an exact semantic JSON comparison against protected main. Eligibility requires that the complete manifest delta contains only verification.last_verified_at and that all other keys and values are equivalent. Preserve existing deny classifications for every other .aegis path and for any additional foundation-manifest mutation. Add focused positive and negative policy tests, document the trust boundary and rollback, run protected-CI-equivalent verification, and deliver as an attended governance PR because merge-policy behavior changes. Do not modify workflow permissions, Aegis runtime assets, operator authority, product code, packages, or lockfiles.

**Test Strategy:**

No test strategy provided.
