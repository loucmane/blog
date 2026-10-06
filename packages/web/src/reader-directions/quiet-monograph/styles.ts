/** Inlined only for the active direction, and nested by the contract under its root. */
export const styles = `
  & { background: var(--qm-paper); color: var(--qm-ink); color-scheme: light; }
  & .qm-page { min-height: 100vh; font-family: var(--qm-text); font-size: var(--qm-body); font-weight: 400; line-height: 1.6; overflow-wrap: anywhere; }
  & .qm-page * { box-sizing: border-box; }
  & .qm-page ::selection { background: var(--qm-sand); color: var(--qm-ink); }
  & .qm-page :where(h1, h2, h3, h4, h5, h6, p, ul, ol, figure, blockquote) { margin: 0; }
  & .qm-page :is(h1, h2, h3, h4, h5, h6) { font-family: var(--qm-display); font-weight: 400; text-wrap: balance; }
  & .qm-page :is(ul, ol) { padding: 0; list-style: none; }
  & .qm-page a { color: inherit; text-decoration: none; text-underline-offset: 0.22em; text-decoration-thickness: 1px; }
  & .qm-page a:hover { text-decoration: underline; }
  & .qm-page :is(a, summary):focus-visible { outline: 2px solid var(--qm-ink); outline-offset: 5px; }
  & .qm-page img { background: var(--qm-sand); border-radius: 0; }
  & .qm-page figcaption { margin-top: 1rem; color: var(--qm-stone-ink); font-family: var(--qm-text); font-size: var(--qm-small); font-weight: 400; line-height: 1.6; }
  & .qm-page figcaption a { display: inline-block; padding-block: 0.75rem; text-decoration: underline; }
  & .qm-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  & .qm-skip { position: absolute; top: 1rem; left: var(--qm-gutter); z-index: 20; transform: translateY(-200%); background: var(--qm-paper); padding: 1rem; }
  & .qm-skip:focus { transform: none; }
  & .qm-masthead { position: relative; margin-inline: auto; width: min(100% - var(--qm-gutter) * 2, var(--qm-page)); min-height: 7rem; padding-block: 1.75rem; border-bottom: 1px solid var(--qm-sand); }
  & .qm-page .qm-wordmark { width: calc(100% - 6rem); font-family: var(--qm-display); font-size: clamp(1rem, 0.8rem + 0.5vw, 1.3125rem); font-weight: 500; letter-spacing: 0.32em; text-transform: uppercase; line-height: 1.6; }
  & .qm-wordmark a { display: inline-flex; align-items: center; min-height: 44px; padding-block: 0.25rem; }
  & .qm-menu summary { position: absolute; top: 1.75rem; right: 0; min-width: 5rem; min-height: 44px; display: flex; justify-content: flex-end; align-items: center; gap: 0.875rem; cursor: pointer; list-style: none; font-size: var(--qm-small); }
  & .qm-menu summary::-webkit-details-marker { display: none; }
  & .qm-menu-mark { width: 1rem; height: 0.375rem; border-block: 1px solid currentColor; }
  & .qm-menu[open] .qm-menu-mark { height: 0; border-bottom: 0; }
  & .qm-menu nav { padding-top: 2rem; }
  & .qm-menu ul { display: flex; flex-wrap: wrap; gap: 0.5rem 2.5rem; }
  & .qm-menu a { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; font-size: var(--qm-small); }
  & .qm-menu a[aria-current] { text-decoration: underline; }
  & .qm-page main { width: min(100% - var(--qm-gutter) * 2, var(--qm-page)); margin-inline: auto; }
  & .qm-page .qm-label { font-family: var(--qm-text); font-size: var(--qm-label); font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--qm-stone-ink); line-height: 1.6; }
  & .qm-label a { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; }
  & .qm-cover { padding-top: clamp(2.5rem, 6vw, 5.5rem); text-align: center; }
  & .qm-cover-title { max-width: 21ch; margin: 0.5rem auto 2.75rem; font-size: var(--qm-title); text-transform: uppercase; letter-spacing: 0.035em; line-height: 1.05; }
  & .qm-cover-title a { display: block; }
  & .qm-cover-image { display: block; max-width: 58rem; margin-inline: auto; }
  & .qm-cover-image img { box-shadow: 0 0.5rem 1.75rem #1C1B1914; }
  & .qm-page .qm-cover-dek { max-width: 48ch; margin: 2rem auto 1rem; font-size: var(--qm-dek); font-weight: 300; }
  & .qm-read { display: inline-flex; align-items: center; gap: 0.6rem; min-height: 44px; margin-top: 1rem; font-size: var(--qm-small); border-bottom: 1px solid var(--qm-stone); }
  & .qm-cover-text { padding-block: var(--qm-space); }
  & .qm-recent { margin-top: var(--qm-space); padding-top: 2.5rem; border-top: 1px solid var(--qm-sand); }
  & .qm-trio { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(2rem, 5vw, 5rem); }
  & .qm-card-title { font-size: var(--qm-card); line-height: 1.15; }
  & .qm-card-title a { display: block; min-height: 44px; padding-block: 0.35rem; }
  & .qm-page .qm-date { font-size: var(--qm-small); color: var(--qm-stone-ink); margin-top: 1.25rem; }
  & .qm-more { max-width: 60rem; margin: var(--qm-space) auto 0; }
  & .qm-more > h2 { padding-bottom: 1.5rem; }
  & .qm-more li { display: grid; grid-template-columns: 8rem minmax(0, 1fr); gap: 0 2.5rem; border-top: 1px solid var(--qm-sand); padding-block: 2rem; }
  & .qm-more li > .qm-date { grid-column: 2; margin-top: 0.5rem; }
  & .qm-empty { max-width: 44rem; margin-inline: auto; padding-block: var(--qm-space); min-height: 55vh; text-align: center; }
  & .qm-empty h2 { font-size: var(--qm-title); line-height: 1.1; }
  & .qm-empty p { margin-top: 2rem; color: var(--qm-stone-ink); }
  & .qm-article { padding-top: clamp(2rem, 5vw, 4rem); }
  & .qm-hero { max-width: 60rem; margin-inline: auto; }
  & .qm-hero img { box-shadow: 0 0.5rem 1.75rem #1C1B1914; }
  & .qm-article-header { max-width: 55rem; margin: clamp(3rem, 7vw, 6rem) auto 3.5rem; text-align: center; }
  & .qm-article-text .qm-article-header { margin-top: 2rem; }
  & .qm-article-header h1 { margin-top: 1rem; font-size: var(--qm-title); line-height: 1.05; }
  & .qm-page .qm-dek { max-width: 48ch; margin: 1.75rem auto 0; font-size: var(--qm-dek); font-weight: 300; line-height: 1.6; }
  & .qm-byline { margin-top: 2rem; color: var(--qm-stone-ink); font-size: var(--qm-small); line-height: 1.8; }
  & .qm-body { max-width: var(--qm-measure); margin-inline: auto; line-height: var(--qm-leading); }
  & .qm-body > * + * { margin-top: 1.75rem; }
  & .qm-body :is(h2, h3, h4, h5, h6) { line-height: 1.2; margin-block: 3rem 1.25rem; }
  & .qm-body h2 { font-size: var(--qm-heading); }
  & .qm-body h3 { font-size: var(--qm-card); }
  & .qm-body :is(h4, h5, h6) { font-size: var(--qm-dek); font-weight: 500; }
  & .qm-body strong { font-weight: 500; }
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
  & .qm-section-header { padding-block: var(--qm-space); text-align: center; }
  & .qm-section-header h1 { font-size: var(--qm-section-title); line-height: 1.05; margin-top: 1.5rem; }
  & .qm-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--qm-space) clamp(2rem, 7vw, 7rem); }
  & .qm-story-link { display: block; }
  & .qm-grid .qm-card-title { margin-top: 1.75rem; padding-block: 0.35rem; }
  & .qm-page .qm-story-dek { margin-top: 1rem; max-width: 48ch; font-size: var(--qm-body); }
  & .qm-story-text { border-top: 1px solid var(--qm-sand); padding-top: 1.5rem; align-self: start; }
  & .qm-story-text .qm-card-title { margin-top: 0; font-size: var(--qm-heading); }
  & .qm-section-empty { text-align: center; color: var(--qm-stone-ink); padding-bottom: var(--qm-space); }
  & .qm-footer { width: min(100% - var(--qm-gutter) * 2, var(--qm-page)); margin: var(--qm-space) auto 0; padding-block: 2rem 3rem; border-top: 1px solid var(--qm-sand); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem 2rem; font-size: var(--qm-small); }
  & .qm-footer-brand { font-family: var(--qm-display); letter-spacing: 0.18em; text-transform: uppercase; }
  & .qm-footer a { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px; }
  @media (max-width: 767px) {
    & .qm-trio, & .qm-grid { grid-template-columns: 1fr; }
    & .qm-trio li + li { padding-top: 2rem; border-top: 1px solid var(--qm-sand); }
    & .qm-more li { grid-template-columns: 1fr; gap: 0; }
    & .qm-more li > .qm-date { grid-column: 1; }
    & .qm-body [data-block='gallery'] { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    & .qm-page *, & .qm-page *::before, & .qm-page *::after { scroll-behavior: auto; animation: none; transition: none; }
  }
  @media (forced-colors: active) {
    & .qm-page :is(a, summary):focus-visible { outline-color: Highlight; }
  }
  @media print {
    & .qm-menu, & .qm-skip, & .qm-footer { display: none; }
    & .qm-page main { width: 100%; }
    & .qm-body { max-width: 66ch; }
    & .qm-page img { box-shadow: none; }
  }
`
