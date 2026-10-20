/*
 * Inlined only for the active direction, and nested by the contract under its root.
 *
 * Pictures are never cropped: plates size each image by its fit factors (fit.ts), set inline as
 * --qm-fit and --qm-fit-sm. Images are selected through the shared <picture> wrapper, never with a
 * child selector. Breakpoints: 600px (wordmark tracking, Theme label), 768px (two-column hang,
 * bays, monograms, two-column rows) and 1024px (navigation row instead of the menu).
 *
 * Italics are genuine faces only (font-synthesis: none on .qm-page): deks are Cormorant 400 italic,
 * and emphasis uses the 400 italic of the family it sits in. The browser never slants or bolds a
 * face. See fonts/README.md.
 */
export const styles = `
  & { background: var(--qm-paper); color: var(--qm-ink); color-scheme: var(--qm-scheme); }
  & .qm-page { min-height: 100vh; font-family: var(--qm-text); font-size: var(--qm-body); font-weight: 400; line-height: 1.6; overflow-wrap: anywhere; font-synthesis: none; }
  & .qm-page * { box-sizing: border-box; }
  & .qm-page ::selection { background: var(--qm-sand); color: var(--qm-ink); }
  & .qm-page :where(h1, h2, h3, h4, h5, h6, p, ul, ol, figure, blockquote) { margin: 0; }
  & .qm-page :is(h1, h2, h3, h4, h5, h6) { font-family: var(--qm-display); font-weight: 400; text-wrap: balance; }
  & .qm-page :where(h1, h2, h3, h4, h5, h6) { line-height: 1.2; }
  & .qm-page :is(ul, ol) { padding: 0; list-style: none; }
  & .qm-page strong { font-weight: 500; }
  & .qm-page a { color: inherit; text-decoration: none; text-underline-offset: 0.22em; text-decoration-thickness: 1px; }
  & .qm-page a:hover, & .qm-page nav a[aria-current] { text-decoration: underline; }
  & .qm-page :is(a, summary, button):focus-visible { outline: 2px solid var(--qm-ink); outline-offset: 5px; }
  & .qm-page img { background: var(--qm-sand); border-radius: 0; }
  & .qm-page figcaption { margin-top: 1rem; color: var(--qm-stone-ink); font-family: var(--qm-text); font-size: var(--qm-small); font-weight: 400; line-height: 1.6; }
  & .qm-page figcaption a { display: inline-block; padding-block: 0.75rem; text-decoration: underline; }
  & .qm-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  & .qm-skip { position: absolute; top: 1rem; left: var(--qm-gutter); z-index: 20; transform: translateY(-200%); background: var(--qm-paper); padding: 1rem; }
  & .qm-skip:focus { transform: none; }
  & .qm-page .qm-label { font-family: var(--qm-text); font-size: var(--qm-label); font-weight: 500; letter-spacing: 0.18em; line-height: 1.6; text-transform: uppercase; color: var(--qm-stone-ink); }
  & .qm-label a { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; color: var(--qm-ink); }
  & .qm-page .qm-meta { color: var(--qm-stone-ink); font-family: var(--qm-text); font-size: var(--qm-small); line-height: 1.6; }
  & .qm-page .qm-dek { max-width: 20em; margin: 2rem auto 0; font-family: var(--qm-display); font-size: var(--qm-dek); font-style: italic; font-weight: 400; line-height: 1.45; text-wrap: pretty; }
  & .qm-page :is(.qm-wordmark, .qm-footer-brand) { font-family: var(--qm-display); font-size: var(--qm-wordmark); font-weight: 500; letter-spacing: 0.32em; line-height: 1.6; text-transform: uppercase; }
  & .qm-masthead { position: relative; display: flex; flex-wrap: wrap; align-items: flex-start; column-gap: 0.75rem; width: min(100% - var(--qm-gutter) * 2, var(--qm-page)); margin-inline: auto; padding-block: 1.75rem; border-bottom: 1px solid var(--qm-sand); }
  & .qm-page .qm-wordmark { flex: 1 1 0; min-width: 0; }
  & .qm-wordmark a { display: inline-flex; align-items: center; min-height: 44px; padding-block: 0.25rem; }
  & .qm-page .qm-theme { flex: none; gap: 0.5rem; min-width: 44px; min-height: 44px; margin-right: 5.25rem; padding: 0 0.25rem; border: 0; border-radius: 0; background: transparent; box-shadow: none; color: var(--qm-ink); font-family: var(--qm-text); font-size: var(--qm-small); font-weight: 400; transition: none; }
  & .qm-page .qm-theme:hover { background: transparent; color: var(--qm-ink); }
  & .qm-theme:hover > span { text-decoration: underline; text-underline-offset: 0.22em; text-decoration-thickness: 1px; }
  & .qm-menu { flex: 1 0 100%; }
  & .qm-menu summary { position: absolute; top: 1.75rem; right: 0; width: 4.5rem; min-height: 44px; display: flex; justify-content: flex-end; align-items: center; gap: 0.875rem; cursor: pointer; list-style: none; font-size: var(--qm-small); }
  & .qm-menu summary::-webkit-details-marker { display: none; }
  & .qm-menu-mark { width: 1rem; height: 0.375rem; border-block: 1px solid currentColor; }
  & .qm-menu[open] .qm-menu-mark { height: 0; border-bottom: 0; }
  & .qm-menu nav { padding-top: 1.75rem; text-align: center; }
  & .qm-menu a { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; font-family: var(--qm-display); font-size: var(--qm-card); line-height: 1.2; }
  & .qm-nav-row { display: none; }
  & :is(.qm-nav-row, .qm-footer) ul { display: flex; flex-wrap: wrap; justify-content: center; column-gap: 2.5rem; }
  & :is(.qm-nav-row, .qm-footer) a { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; font-size: var(--qm-label); font-weight: 500; letter-spacing: 0.18em; line-height: 1.6; text-transform: uppercase; }
  & .qm-page main { width: min(100% - var(--qm-gutter) * 2, var(--qm-page)); margin-inline: auto; }
  & .qm-plate { position: relative; }
  & .qm-plate-title a::after { content: ''; position: absolute; inset: 0; }
  & .qm-plate .qm-label a { position: relative; z-index: 1; }
  & .qm-plate:is(:hover, :has(:focus-visible)) .qm-plate-title a { text-decoration: underline; }
  & .qm-plate-box { margin-inline: auto; }
  & .qm-plate-box picture img { display: block; width: calc(var(--qm-fit-sm, 1) * 100%); height: auto; margin-inline: auto; box-shadow: var(--qm-print); transition: box-shadow 200ms ease-out; }
  & .qm-plate:is(:hover, :has(:focus-visible)) .qm-plate-box picture img { box-shadow: var(--qm-print-hover); }
  & .qm-plate-box > div { background: transparent; }
  & .qm-plate-box > div picture img { width: 100%; height: 100%; object-fit: contain; object-position: 50% 50% !important; background: transparent; box-shadow: none; }
  & :is(.qm-plate-box, .qm-bay) + .qm-wall-label { margin-top: 1.75rem; }
  & .qm-page .qm-plate-dek { max-width: 30em; margin: 1rem auto 0; color: var(--qm-stone-ink); font-size: var(--qm-copy); line-height: 1.6; text-wrap: pretty; }
  & .qm-wall-label .qm-meta { margin-top: 1rem; }
  & .qm-plate-text .qm-wall-label { margin-top: 0; padding-top: 2.5rem; border-top: 1px solid var(--qm-sand); }
  & .qm-cover { padding-top: clamp(2.5rem, 6vw, 5.5rem); text-align: center; }
  & .qm-cover-title { max-width: 14em; margin: 0.5rem auto 2.75rem; font-size: var(--qm-title); line-height: 1.05; }
  & .qm-cover-title.qm-title-long { font-size: var(--qm-title-long); }
  & .qm-cover .qm-plate-box { width: min(100%, 58rem); }
  & .qm-cover .qm-meta { margin-top: 1.25rem; }
  & .qm-cover-text { padding-block: var(--qm-space); }
  & .qm-cover-text .qm-cover-title { margin-bottom: 0; }
  & .qm-rooms { margin-top: var(--qm-space); }
  & .qm-room-list > li + li { margin-top: var(--qm-space); }
  & .qm-room { width: min(100%, 46rem); margin-inline: auto; text-align: center; }
  & .qm-room-title { margin-top: 0.5rem; font-size: var(--qm-heading); }
  & .qm-earlier { width: min(100%, 46rem); margin: var(--qm-space) auto 0; }
  & .qm-earlier > h2 { padding-bottom: 1.25rem; }
  & .qm-row { display: grid; grid-template-columns: 9rem minmax(0, 1fr); column-gap: 2.5rem; align-items: baseline; padding-block: 1.75rem; border-top: 1px solid var(--qm-sand); }
  & .qm-row-body { grid-column: 2; }
  & .qm-row-title { font-size: var(--qm-card); line-height: 1.15; }
  & .qm-row-title a { display: block; min-height: 44px; padding-block: 0.35rem; }
  & .qm-row .qm-meta { margin-top: 0.5rem; }
  & .qm-empty { max-width: 44rem; margin-inline: auto; padding-block: var(--qm-space); min-height: 55vh; text-align: center; }
  & .qm-empty h2 { font-size: var(--qm-title); line-height: 1.1; }
  & .qm-empty p { margin-top: 2rem; color: var(--qm-stone-ink); }
  & .qm-section-header { padding-block: var(--qm-space); text-align: center; }
  & .qm-section-header h1 { margin-top: 1.5rem; font-size: var(--qm-section-title); line-height: 1.05; }
  & .qm-section-header .qm-meta { margin-top: 1.75rem; }
  & .qm-hang { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--qm-space); }
  & .qm-hang-item { text-align: center; }
  & .qm-hang-title { font-size: var(--qm-card); line-height: 1.15; }
  & .qm-monogram { display: none; }
  & .qm-section-empty { padding-bottom: var(--qm-space); color: var(--qm-stone-ink); text-align: center; }
  & .qm-section-empty .qm-label { margin-top: 1.25rem; }
  & .qm-article { padding-top: clamp(2rem, 5vw, 4rem); }
  & .qm-hero { max-width: 60rem; margin-inline: auto; }
  & .qm-hero img { box-shadow: var(--qm-print); }
  & .qm-article-header { max-width: 55rem; margin: clamp(3rem, 7vw, 6rem) auto 3.5rem; text-align: center; }
  & .qm-article-text .qm-article-header { margin-top: 2rem; }
  & .qm-article-header h1 { margin-top: 1rem; font-size: var(--qm-title); line-height: 1.05; }
  & .qm-byline { margin-top: 2rem; color: var(--qm-stone-ink); font-size: var(--qm-small); line-height: 1.8; }
  & .qm-body { max-width: var(--qm-measure); margin-inline: auto; line-height: var(--qm-leading); }
  & .qm-body > * + * { margin-top: 1.75rem; }
  & .qm-body :is(h2, h3, h4, h5, h6) { line-height: 1.2; margin-block: 3rem 1.25rem; }
  & .qm-body h2 { font-size: var(--qm-heading); }
  & .qm-body h3 { font-size: var(--qm-card); }
  & .qm-body :is(h4, h5, h6) { font-size: var(--qm-dek); font-weight: 500; }
  & .qm-body a { text-decoration: underline; }
  & .qm-body :is(ul, ol) { padding-left: 1.5rem; }
  & .qm-body ul { list-style-type: disc; }
  & .qm-body ol { list-style-type: decimal; }
  & .qm-body ol[type='a'] { list-style-type: lower-alpha; }
  & .qm-body ol[type='A'] { list-style-type: upper-alpha; }
  & .qm-body ol[type='i'] { list-style-type: lower-roman; }
  & .qm-body ol[type='I'] { list-style-type: upper-roman; }
  & .qm-body li + li { margin-top: 0.625rem; }
  & .qm-body li > * + * { margin-top: 0.75rem; }
  & .qm-body blockquote { border-left: 1px solid var(--qm-stone); padding-left: 1.5rem; }
  & .qm-body blockquote > * + * { margin-top: 1.25rem; }
  & .qm-body > figure:has(picture), & .qm-body > [data-block='gallery'] { width: min(42rem, 100vw - var(--qm-gutter) * 2); max-width: none; margin-block: 3rem; margin-left: 50%; transform: translateX(-50%); }
  & .qm-body [data-block='pull-quote'] { padding-block: 2rem; margin-block: 3rem; text-align: center; border-block: 1px solid var(--qm-sand); }
  & .qm-body [data-block='pull-quote'] blockquote { border: 0; padding: 0; font-family: var(--qm-display); font-size: var(--qm-heading); line-height: 1.2; }
  & .qm-body [data-block='gallery'] { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem 1.5rem; align-items: start; }
  & .qm-body [data-block='gallery'] li { min-width: 0; margin: 0; }
  & .qm-body [data-layout='carousel'] { grid-template-columns: 1fr; }
  & .qm-body [data-block='checklist'] { list-style: none; padding: 0; }
  & .qm-body [data-block='checklist'] li { position: relative; padding-left: 1.75rem; }
  & .qm-body [data-block='checklist'] li > span[aria-hidden] { position: absolute; left: 0; top: 0; }
  & .qm-body [data-block='checklist'] li > p { margin-top: 0; }
  & .qm-body :is([data-block='callout'], [data-block='editorial'], [data-block='embed']) { padding: clamp(1.25rem, 3vw, 2rem); border: 1px solid var(--qm-sand); }
  & .qm-body :is([data-block='callout'], [data-block='editorial']) > * + * { margin-top: 1rem; }
  & .qm-body [data-block='editorial'] > :first-child { margin-top: 0; }
  & .qm-body [data-block='embed'] a { display: inline-block; min-height: 44px; padding-block: 0.5rem; }
  & .qm-body code { font-family: ui-monospace, monospace; font-size: 0.85em; overflow-wrap: anywhere; }
  & .qm-body pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: 1.25rem; border-block: 1px solid var(--qm-sand); }
  & .qm-body hr { width: 4rem; border: 0; border-top: 1px solid var(--qm-stone); margin: 3rem auto; }
  & .qm-footer { display: grid; justify-items: center; gap: 1rem; width: min(100% - var(--qm-gutter) * 2, var(--qm-page)); margin: var(--qm-space) auto 0; padding-block: 2.5rem 3rem; border-top: 1px solid var(--qm-sand); text-align: center; }
  @media (max-width: 599px) {
    & .qm-page :is(.qm-wordmark, .qm-footer-brand) { letter-spacing: 0.2em; }
    & .qm-theme > span { display: none; }
  }
  @media (max-width: 767px) {
    & .qm-row { grid-template-columns: minmax(0, 1fr); }
    & .qm-row-body { grid-column: 1; }
    & .qm-body [data-block='gallery'] { grid-template-columns: 1fr; }
  }
  @media (min-width: 768px) {
    & .qm-plate-box picture img { width: calc(var(--qm-fit, 1) * 100%); }
    & .qm-hang { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: clamp(2rem, 7vw, 7rem); }
    & .qm-bay { aspect-ratio: 1; display: flex; align-items: flex-end; justify-content: center; }
    & .qm-monogram { align-items: center; border: 1px solid var(--qm-sand); color: var(--qm-stone); font-family: var(--qm-display); font-size: var(--qm-monogram); line-height: 1; }
    & .qm-plate-monogram .qm-wall-label { margin-top: 1.75rem; padding-top: 0; border-top: 0; }
  }
  @media (min-width: 1024px) {
    & .qm-masthead { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; row-gap: 1rem; padding-bottom: 0.75rem; }
    & .qm-page .qm-wordmark { grid-column: 2; grid-row: 1; text-align: center; }
    & .qm-page .qm-theme { grid-column: 3; grid-row: 1; justify-self: end; margin-right: 0; }
    & .qm-menu { display: none; }
    & .qm-nav-row { display: block; grid-column: 1 / -1; grid-row: 2; }
  }
  @media (prefers-reduced-motion: reduce) {
    & .qm-page *, & .qm-page *::before, & .qm-page *::after { scroll-behavior: auto; animation: none; transition: none; }
  }
  @media (forced-colors: active) {
    & .qm-page :is(a, summary, button):focus-visible { outline-color: Highlight; }
  }
  @media print {
    & .qm-skip, & .qm-theme, & .qm-menu, & .qm-nav-row, & .qm-footer { display: none; }
    & .qm-page main { width: 100%; }
    & .qm-hang { grid-template-columns: minmax(0, 1fr); }
    & .qm-body { max-width: 66ch; }
    & .qm-page { --qm-print: none; --qm-print-hover: none; }
    & .qm-page img { box-shadow: none; }
  }
`
