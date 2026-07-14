# Accessibility Verification

## Current Baseline

The magazine foundation targets WCAG 2.2 AA. Protected verification combines deterministic contracts with production-browser evidence rather than relying on the superseded 2025 component-demo checklist.

Task 41 verified:

- semantic document and control roles;
- visible keyboard focus and menu navigation;
- 44px minimum theme-trigger target;
- light and dark palette axe baselines at desktop and mobile viewports;
- reduced-motion rules independent of color preference;
- forced-colors token and focus fallbacks;
- responsive typography, wrapping, and card boundaries;
- no skipped, focused, or incomplete critical browser journey.

## Commands

```bash
pnpm test:quality-contract
pnpm test:capability
pnpm test:browser
```

Task 41's detailed results are recorded in its verification report. Future owner-editor and reader components must add journey-specific keyboard, screen-reader semantics, error-state, zoom/reflow, touch, contrast, and manual-review evidence; passing the current shell baseline does not certify unbuilt product features.
