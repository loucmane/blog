/** Emitted and scoped by the active direction root; no imported stylesheets. */
export const styles = `
  & { background: var(--si-paper); color: var(--si-ink); }
  & .si-page { min-height: 100vh; font-family: var(--si-sans); font-size: var(--si-body); font-weight: 400; line-height: 1.5; overflow-wrap: anywhere; }
  & .si-page * { box-sizing: border-box; min-width: 0; }
  & .si-page ::selection { background: var(--si-ink); color: var(--si-paper); }
  & .si-page :where(h1, h2, h3, h4, h5, h6, p, ul, ol, dl, dd, figure, blockquote) { margin: 0; }
  & .si-page :is(h1, h2, h3, h4, h5, h6) { font-family: var(--si-sans); font-weight: 700; letter-spacing: -0.035em; text-wrap: pretty; }
  & .si-page :is(ul, ol) { padding: 0; list-style: none; }
  & .si-page a { color: inherit; text-decoration: none; text-underline-offset: 0.18em; text-decoration-thickness: 1px; }
  & .si-page a:hover { text-decoration: underline; }
  & .si-page :focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  & .si-page img { border-radius: 0; }
  & .si-page figcaption { margin-top: 0.75rem; font-family: var(--si-mono); font-size: var(--si-small); color: var(--si-secondary); line-height: 1.7; }
  & .si-page figcaption a { display: inline-block; min-height: 44px; padding-block: 0.625rem; text-decoration: underline; }
  & .si-skip { position: absolute; top: 1rem; left: var(--si-gutter); z-index: 20; transform: translateY(-200%); padding: 1rem; background: var(--si-paper); font-family: var(--si-mono); font-size: var(--si-small); }
  & .si-skip:focus { transform: none; }
  & .si-masthead, & .si-page main, & .si-footer { width: min(100% - var(--si-gutter) * 2, var(--si-page)); margin-inline: auto; }
  & .si-masthead { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--si-gap); padding-block: 2rem 1.5rem; border-bottom: 4px solid var(--si-ink); }
  & .si-page .si-wordmark { font-size: var(--si-wordmark); font-weight: 800; line-height: 0.95; letter-spacing: -0.065em; }
  & .si-wordmark a { display: inline-block; min-height: 44px; }
  & .si-wordmark span { display: block; }
  & .si-masthead nav { grid-column: 2 / -1; }
  & .si-masthead ul { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 var(--si-gap); }
  & .si-masthead li { border-left: 1px solid var(--si-ink); padding-left: 1rem; }
  & .si-masthead nav a { display: flex; align-items: center; min-width: 44px; min-height: 44px; padding-block: 0.5rem; font-family: var(--si-mono); font-size: var(--si-small); }
  & .si-masthead a[aria-current] { font-weight: 500; text-decoration: underline; text-underline-offset: 0.4em; }
  & .si-page .si-label { font-family: var(--si-mono); font-size: var(--si-label); font-weight: 500; line-height: 1.6; letter-spacing: 0.03em; text-transform: uppercase; }
  & .si-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3rem var(--si-gap); }
  & .si-page .si-home-grid { padding-top: 1.5rem; }
  & .si-card { border-top: 1px solid var(--si-ink); }
  & .si-card-wide { grid-column: span 2; }
  & .si-story-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.75rem; min-height: 60px; padding-block: 0.375rem; font-family: var(--si-mono); font-size: var(--si-label); line-height: 1.6; }
  & .si-number { font-weight: 500; font-variant-numeric: tabular-nums; }
  & .si-story-meta a { display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; }
  & .si-reading-time { color: var(--si-secondary); }
  & .si-state { background: var(--si-signal); color: var(--si-signal-ink); padding: 0.2rem 0.45rem; font-weight: 500; }
  & .si-card-image { position: relative; aspect-ratio: 4 / 3; margin-bottom: 1rem; }
  & .si-card-image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  & .si-card-image > div { height: 100%; }
  & .si-card-wide .si-card-image { aspect-ratio: 3 / 2; }
  & .si-card-title { font-size: var(--si-card); line-height: 1.08; }
  & .si-card-wide .si-card-title { font-size: var(--si-heading); }
  & .si-card-title a { display: block; min-height: 44px; padding-bottom: 0.25rem; }
  & .si-card-text .si-card-title { padding-top: 1.25rem; }
  & .si-card-dek { margin-top: 0.75rem; font-size: var(--si-copy); line-height: 1.6; max-width: 60ch; color: var(--si-secondary); }
  & .si-latest { margin-top: var(--si-space); }
  & .si-latest > .si-label { padding-bottom: 1rem; }
  & .si-index > li { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--si-gap); border-top: 1px solid var(--si-ink); padding-block: 1.25rem; }
  & .si-index .si-story-meta { align-self: start; align-items: baseline; padding: 0; }
  & .si-index .si-reading-time { width: 100%; }
  & .si-index-copy { grid-column: span 3; }
  & .si-index-copy h3 { font-size: var(--si-card); line-height: 1.15; }
  & .si-index-copy h3 a { display: block; min-height: 44px; }
  & .si-index-copy p { font-size: var(--si-copy); color: var(--si-secondary); max-width: 65ch; margin-top: 0.5rem; }
  & .si-empty { padding-block: var(--si-space); min-height: 50vh; }
  & .si-empty h2 { font-size: var(--si-title); line-height: 1.05; }
  & .si-empty p { margin-top: 1.5rem; max-width: 40ch; color: var(--si-secondary); }
  & .si-article { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--si-gap); padding-top: 2rem; counter-reset: si-figure; }
  & .si-rail { align-self: start; border-top: 4px solid var(--si-ink); padding-top: 1rem; font-family: var(--si-mono); font-size: var(--si-small); line-height: 1.65; }
  & .si-rail > div + div { margin-top: 1.5rem; }
  & .si-rail dt { color: var(--si-secondary); margin-bottom: 0.25rem; }
  & .si-rail a { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; text-decoration: underline; }
  & .si-article-main { grid-column: span 3; }
  & .si-article-header h1 { font-size: var(--si-title); font-weight: 800; line-height: 0.98; letter-spacing: -0.06em; }
  & .si-dek { font-size: var(--si-dek); line-height: 1.5; max-width: 50ch; margin-top: 1.75rem; }
  & .si-hero { margin-block: 2.5rem 3rem; }
  & .si-article figure:has(picture) { counter-increment: si-figure; }
  & .si-article figure:has(picture)::before { content: 'Fig. ' counter(si-figure); display: block; font-family: var(--si-mono); font-size: var(--si-label); line-height: 1.6; color: var(--si-secondary); padding-bottom: 0.5rem; }
  & .si-body { max-width: var(--si-measure); line-height: var(--si-leading); margin-top: 3rem; display: flow-root; }
  & .si-body > * + * { margin-top: 1.5rem; }
  & .si-body :is(h2, h3, h4, h5, h6) { line-height: 1.15; margin-block: 2.75rem 1rem; }
  & .si-body h2 { font-size: var(--si-heading); }
  & .si-body h3 { font-size: var(--si-card); }
  & .si-body :is(h4, h5, h6) { font-size: var(--si-dek); }
  & .si-body strong { font-weight: 700; }
  & .si-body a { text-decoration: underline; }
  & .si-body :is(ul, ol) { padding-left: 1.5rem; }
  & .si-body ul { list-style-type: disc; }
  & .si-body ol { list-style-type: decimal; }
  & .si-body ol[type='a'] { list-style-type: lower-alpha; }
  & .si-body ol[type='A'] { list-style-type: upper-alpha; }
  & .si-body ol[type='i'] { list-style-type: lower-roman; }
  & .si-body ol[type='I'] { list-style-type: upper-roman; }
  & .si-body li + li { margin-top: 0.5rem; }
  & .si-body li > * + * { margin-top: 0.75rem; }
  & .si-body blockquote { border-left: 4px solid var(--si-ink); padding-left: 1.5rem; }
  & .si-body blockquote > * + * { margin-top: 1.25rem; }
  & .si-body [data-block='pull-quote'] { padding-block: 2rem; border-block: 1px solid var(--si-ink); }
  & .si-body [data-block='pull-quote'] blockquote { padding: 0; border: 0; font-size: var(--si-heading); font-weight: 700; letter-spacing: -0.035em; line-height: 1.2; }
  & .si-body [data-block='gallery'] { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; align-items: start; }
  & .si-body [data-block='gallery'] li { margin: 0; }
  & .si-body [data-layout='carousel'] { grid-template-columns: 1fr; }
  & .si-body [data-block='checklist'] { list-style: none; padding: 0; }
  & .si-body [data-block='checklist'] li { position: relative; padding-left: 1.75rem; }
  & .si-body [data-block='checklist'] li > span[aria-hidden] { position: absolute; left: 0; top: 0; }
  & .si-body [data-block='checklist'] li > p { margin-top: 0; }
  & .si-body :is([data-block='callout'], [data-block='editorial'], [data-block='embed']) { border: 1px solid var(--si-ink); padding: clamp(1rem, 3vw, 2rem); }
  & .si-body :is([data-block='callout'], [data-block='editorial']) > * + * { margin-top: 1rem; }
  & .si-body [data-block='editorial'] > :first-child { margin-top: 0; }
  & .si-body [data-block='embed'] a { display: inline-block; min-height: 44px; padding-block: 0.5rem; }
  & .si-body code { font-family: var(--si-mono); font-size: var(--si-copy); overflow-wrap: anywhere; }
  & .si-body pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: 1.25rem; border-block: 1px solid var(--si-ink); }
  & .si-body hr { border: 0; border-top: 4px solid var(--si-ink); margin-block: 3rem; }
  & .si-section-header { padding-block: 2rem var(--si-space); }
  & .si-section-header .si-label { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
  & .si-section-header h1 { font-size: var(--si-title); font-weight: 800; line-height: 1; letter-spacing: -0.06em; margin-top: 1.5rem; }
  & .si-section-empty { border-top: 1px solid var(--si-ink); padding-block: 2rem; color: var(--si-secondary); }
  & .si-footer { border-top: 4px solid var(--si-ink); margin-top: var(--si-space); padding-block: 1.5rem 3rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem 2rem; font-size: var(--si-copy); font-weight: 700; }
  & .si-footer a { display: inline-flex; align-items: center; min-height: 44px; gap: 1rem; font-family: var(--si-mono); font-size: var(--si-small); font-weight: 400; }
  @media (max-width: 1023px) {
    & .si-masthead { grid-template-columns: 1fr; }
    & .si-masthead nav { grid-column: 1; }
    & .si-masthead ul { gap: 0 1rem; }
    & .si-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .si-article { grid-template-columns: 1fr; gap: 2rem; }
    & .si-article-main { grid-column: auto; }
    & .si-rail { display: flex; flex-wrap: wrap; gap: 1rem 2rem; }
    & .si-rail > div + div { margin: 0; }
    & .si-rail a { align-items: flex-start; }
  }
  @media (max-width: 599px) {
    & .si-article-header h1 { letter-spacing: -0.04em; }
    & .si-grid { grid-template-columns: 1fr; }
    & .si-card-wide { grid-column: auto; }
    & .si-masthead { padding-top: 1.5rem; }
    & .si-masthead li { padding-left: 0.5rem; }
    & .si-masthead nav a { font-size: var(--si-label); }
    & .si-index > li { grid-template-columns: 1fr; gap: 0.5rem; }
    & .si-index-copy { grid-column: auto; }
    & .si-index .si-reading-time { width: auto; }
    & .si-body [data-block='gallery'] { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    & .si-page *, & .si-page *::before, & .si-page *::after { scroll-behavior: auto; animation: none; transition: none; }
  }
  @media (forced-colors: active) {
    & .si-page :focus-visible { outline-color: Highlight; }
    & .si-state { border: 1px solid currentColor; }
  }
  @media print {
    & .si-skip, & .si-masthead nav, & .si-footer { display: none; }
    & .si-page main { width: 100%; }
    & .si-article { display: block; }
    & .si-body { max-width: 65ch; }
  }
`
