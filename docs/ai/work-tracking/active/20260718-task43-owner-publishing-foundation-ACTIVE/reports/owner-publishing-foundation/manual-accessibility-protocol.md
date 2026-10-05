# Task 43 Manual Accessibility Protocol

**Status:** attended validation required before Task 43 is declared complete
**Authority:** `standing-grant:sota-magazine-2026-autonomy-v2` does not substitute for human assistive-technology judgment

## Preconditions

- Run the exact reviewed production build and Task 43 PR head.
- Use a clean owner fixture account containing one draft, one published story, media, and at least three revisions.
- Record browser, operating system, assistive technology, version, viewport, and input method.

## Screen-Reader Journey

1. Sign in and confirm the page title, main landmark, owner navigation, and signed-in identity are announced once and in a useful order.
2. Open a draft and navigate title, summary, formatting toolbar, body, publication controls, media library, and revision history by landmarks and headings.
3. Write and format a heading, list, link, quote, checklist, and callout without a pointer. Confirm state changes and toolbar pressed states are announced.
4. Trigger an incomplete publication attempt. Confirm the plain-language error is announced without losing the draft or trapping focus.
5. Save, disconnect, edit, reconnect, and confirm offline/recovery status messages are announced without repeated noise.
6. Trigger a two-window conflict and confirm both versions remain understandable and the recovery choices are operable.
7. Preview, schedule, cancel a schedule, publish, unpublish, restore a revision, delete, and restore the story. Confirm every destructive action and resulting status is announced.
8. Add an image and confirm filename, required alt text, credit, caption, focal-point controls, and validation are understandable.

## Visual and Input Journey

1. Repeat the owner journey at 200% browser zoom and at 320 CSS-pixel reflow without two-dimensional scrolling or obscured controls.
2. Repeat with reduced motion and forced colors enabled; confirm visible focus and no information depends on animation or color alone.
3. Repeat the core authoring and lifecycle controls on a touch device with its virtual keyboard; confirm controls remain visible and at least 44 CSS pixels high.
4. Complete the journey using keyboard only and confirm logical focus order, no keyboard trap, and focus recovery after errors and dialogs.

## Required Evidence

- Pass/fail for every step, with issue severity and exact route/control.
- Short notes for announcement quality, unexpected verbosity, missing context, focus loss, reflow, and virtual-keyboard obstruction.
- Screenshots or recordings only when they contain no credentials, tokens, private drafts, or personal data.
- Any failure remains blocking for Task 43 closeout until fixed or explicitly accepted by the owner at an attended boundary.
