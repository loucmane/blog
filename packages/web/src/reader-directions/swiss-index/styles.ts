/**
 * Emitted and scoped by the active direction root; no imported stylesheets. Element resets wrap the
 * page in `:where()`, so they carry no more than the root's specificity and every component rule
 * overrides them, whatever its order. Rules underline with `text-decoration-line`, because the
 * shorthand would reset the 1px thickness the link reset sets. Index rows hold their section and
 * reading time twice (`index-row.tsx`): desktop shows the copy after the dek, and one query below
 * 1024px swaps in the copy in the metadata, so exactly one copy shows at any width. The article's
 * parts sit in named grid areas, which list them in DOM order below 1024px. An upright hero's
 * picture takes no part in layout: its image is an item of the figure's grid, its sources are not.
 * Checklist rules reach only the checklist's own items (`> li`), so a list nested in a task keeps
 * the body's list styles and draws no box. Emphasis takes the genuine 400 and 700 italics; the page
 * keeps weight and style synthesis because each family's fallback is one upright local face, and a
 * cold view that keeps it must still show bold and italic text.
 */
export const styles = `
  & { background: var(--si-paper); color: var(--si-ink); }
  & .si-page { min-height: 100vh; font-family: var(--si-sans); font-size: var(--si-body); font-weight: 400; font-synthesis: weight style; line-height: 1.5; overflow-wrap: anywhere; }
  & :where(.si-page) * { box-sizing: border-box; min-width: 0; }
  & .si-page ::selection { background: var(--si-ink); color: var(--si-paper); }
  & :where(.si-page) :where(h1, h2, h3, h4, h5, h6, p, ul, ol, dl, dd, figure, blockquote) { margin: 0; }
  & :where(.si-page) :is(h1, h2, h3, h4, h5, h6) { font-family: var(--si-sans); }
  & :where(.si-page) :where(h1, h2, h3, h4, h5, h6) { font-weight: 700; letter-spacing: -0.035em; text-wrap: pretty; }
  & :where(.si-page) :where(ul, ol) { padding: 0; list-style: none; }
  & :where(.si-page) a { color: inherit; text-decoration: none; text-underline-offset: 0.18em; text-decoration-thickness: 1px; }
  & .si-page a:hover { text-decoration-line: underline; }
  & .si-page :focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  & :where(.si-page) img { border-radius: 0; }
  & :where(.si-page) time { font-variant-numeric: tabular-nums; }
  & .si-page figcaption { max-width: 65ch; margin-top: 0.75rem; font-family: var(--si-mono); font-size: var(--si-small); color: var(--si-secondary); line-height: 1.7; }
  & .si-page figcaption a { display: inline-block; min-height: 44px; padding-block: 0.625rem; text-decoration-line: underline; }
  & .si-skip { position: absolute; top: 1rem; left: var(--si-gutter); z-index: 20; transform: translateY(-200%); padding: 1rem; background: var(--si-paper); font-family: var(--si-mono); font-size: var(--si-small); }
  & .si-skip:focus { transform: none; }
  & .si-masthead, & .si-page main, & .si-footer { width: min(100% - var(--si-gutter) * 2, var(--si-page)); margin-inline: auto; }
  & .si-masthead { padding-block: 2rem 1rem; border-bottom: 4px solid var(--si-ink); }
  & .si-masthead-bar { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem var(--si-gap); }
  & .si-page .si-wordmark { font-size: var(--si-wordmark); font-weight: 800; line-height: 0.95; letter-spacing: -0.065em; }
  & .si-wordmark a { display: inline-block; min-height: 44px; }
  & .si-wordmark span { display: block; }
  & .si-theme { margin-left: auto; display: inline-flex; align-items: center; gap: 0.5rem; min-width: 44px; min-height: 44px; padding: 0 0.875rem; border: 1px solid var(--si-ink); border-radius: 0; background: var(--si-paper); color: var(--si-ink); box-shadow: none; font-family: var(--si-mono); font-size: var(--si-small); font-weight: 500; transition: none; }
  & .si-theme:hover { text-decoration-line: underline; text-underline-offset: 0.18em; }
  & .si-masthead .si-nav { margin-top: 1.5rem; }
  & .si-nav ul { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0 var(--si-gap); }
  & .si-nav li { border-left: 1px solid var(--si-ink); padding-left: 1rem; }
  & .si-nav li[data-current] { border-left: 4px solid var(--si-signal); padding-left: calc(1rem - 3px); }
  & .si-nav a { display: flex; align-items: center; min-width: 44px; min-height: 44px; padding-block: 0.5rem; font-family: var(--si-mono); font-size: var(--si-small); }
  & .si-nav a[aria-current] { font-weight: 500; text-decoration-line: underline; text-underline-offset: 0.4em; }
  & .si-page .si-label { font-family: var(--si-mono); font-size: var(--si-label); font-weight: 500; line-height: 1.6; letter-spacing: 0.03em; text-transform: uppercase; }
  & .si-label-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 0.5rem 1rem; }
  & .si-plates { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3rem var(--si-gap); }
  & .si-cover { padding-top: 1.5rem; }
  & .si-plate { position: relative; border-top: 1px solid var(--si-ink); }
  & .si-plate-lead { grid-column: span 2; }
  & .si-plate-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.75rem; min-height: 60px; padding-block: 0.375rem; font-family: var(--si-mono); font-size: var(--si-label); line-height: 1.6; }
  & .si-number { font-weight: 500; font-variant-numeric: tabular-nums; }
  & .si-plate-meta a { position: relative; z-index: 1; display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; }
  & .si-reading-time { color: var(--si-secondary); }
  & .si-state { background: var(--si-signal); color: var(--si-signal-ink); padding: 0.2rem 0.45rem; font-weight: 500; }
  & .si-plate-image { position: relative; aspect-ratio: 4 / 3; margin-bottom: 1rem; background: var(--si-plate); }
  & .si-plate-lead .si-plate-image { aspect-ratio: 3 / 2; }
  & .si-plate-image > div { height: 100%; }
  & .si-plate-image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: var(--si-focus, 50% 50%); background: none; }
  & .si-number-plate { display: flex; align-items: flex-end; aspect-ratio: 4 / 3; margin-bottom: 1rem; padding: 0.75rem 1rem; background: var(--si-plate); color: var(--si-ink); font-size: var(--si-plate-number); font-weight: 800; line-height: 0.8; letter-spacing: -0.065em; font-variant-numeric: tabular-nums; }
  & .si-plate-title { font-size: var(--si-card); line-height: 1.08; text-wrap: balance; }
  & .si-plate-lead .si-plate-title { font-size: var(--si-heading); }
  & .si-plate-text .si-plate-title { padding-top: 1rem; font-size: var(--si-title); line-height: 1; }
  & .si-plate-long .si-plate-title { font-size: var(--si-title-long); line-height: 1.05; }
  & .si-plate-title a { display: block; min-height: 44px; padding-bottom: 0.25rem; }
  & .si-plate-title a::after { content: ''; position: absolute; inset: 0; }
  & .si-plate-dek { margin-top: 0.75rem; max-width: 60ch; font-size: var(--si-copy); line-height: 1.6; color: var(--si-secondary); }
  & .si-plate-text .si-plate-dek { max-width: 50ch; font-size: var(--si-dek); line-height: 1.5; }
  & .si-earlier, & .si-related { margin-top: var(--si-space); }
  & .si-earlier > .si-label-row, & .si-related > .si-label-row, & .si-stories > .si-label-row { padding-bottom: 1rem; }
  & .si-index > li { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.5rem var(--si-gap); padding-block: 1.25rem; border-top: 1px solid var(--si-ink); }
  & .si-row-meta, & .si-row-facts { display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; font-family: var(--si-mono); font-size: var(--si-label); line-height: 1.6; }
  & .si-row-copy { grid-column: 2 / span 2; }
  & .si-index-sectionless .si-row-copy { grid-column: 2 / -1; }
  & .si-row-facts-wide { grid-column: 4; }
  & .si-row-facts-narrow { display: none; }
  & .si-row-title { font-size: var(--si-card); line-height: 1.15; }
  & .si-row-title a { display: block; min-height: 44px; }
  & .si-row-dek { margin-top: 0.5rem; max-width: 65ch; font-size: var(--si-copy); line-height: 1.6; color: var(--si-secondary); }
  & .si-row-facts a { display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; }
  & .si-empty { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0 var(--si-gap); align-content: start; min-height: 50vh; padding-block: var(--si-space); }
  & .si-empty > * { grid-column: 1 / 4; }
  & .si-empty h2 { padding-top: 1.5rem; border-top: 4px solid var(--si-ink); font-size: var(--si-title); line-height: 1.05; }
  & .si-empty p { margin-top: 1.5rem; max-width: 40ch; color: var(--si-secondary); }
  & .si-page-header { padding-block: 2rem var(--si-space); }
  & .si-page-header h1 { margin-top: 1.5rem; }
  & .si-article-header h1, & .si-page-header h1 { font-size: var(--si-title); font-weight: 800; line-height: 1; letter-spacing: -0.06em; text-wrap: balance; }
  & .si-article-header h1 { line-height: 0.98; }
  & .si-article-header h1.si-title-long, & .si-page-header h1.si-title-long { font-size: var(--si-title-long); line-height: 1.05; }
  & .si-dek { max-width: 50ch; margin-top: 1.75rem; font-size: var(--si-dek); line-height: 1.5; color: var(--si-secondary); }
  & .si-bio { white-space: pre-line; }
  & .si-list-empty { border-top: 1px solid var(--si-ink); padding-block: 2rem; }
  & .si-list-empty p:first-child { color: var(--si-secondary); }
  & .si-list-empty a { display: inline-flex; align-items: center; min-height: 44px; margin-top: 1rem; font-family: var(--si-mono); font-size: var(--si-small); text-decoration-line: underline; }
  & .si-article { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-areas: 'rail head head head' 'rail hero hero hero' 'rail body body body' 'end end end end'; column-gap: var(--si-gap); padding-top: 2rem; counter-reset: si-figure; }
  & .si-article-header { grid-area: head; }
  & .si-rail { grid-area: rail; align-self: start; border-top: 4px solid var(--si-ink); padding-top: 1rem; }
  & .si-rail > div + div { margin-top: 1.5rem; }
  & .si-rail, & .si-end { font-family: var(--si-mono); font-size: var(--si-small); line-height: 1.65; }
  & .si-rail dt, & .si-end dt { font-size: var(--si-label); color: var(--si-secondary); }
  & .si-rail dt { margin-bottom: 0.25rem; }
  & .si-rail a, & .si-end a { display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; text-decoration-line: underline; }
  & .si-hero { grid-area: hero; margin-top: 2.5rem; }
  & .si-hero-upright figure { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: var(--si-gap); }
  & .si-hero-upright figure::before { grid-column: 1 / -1; }
  & .si-hero-upright source { display: none; }
  & .si-hero-upright img { grid-column: 1 / span 2; }
  & .si-hero-upright figcaption { grid-column: 3; align-self: end; margin-top: 0; }
  & .si-article figure:has(picture) { counter-increment: si-figure; }
  & .si-article figure:has(picture)::before { content: 'Fig. ' counter(si-figure) / ''; display: block; font-family: var(--si-mono); font-size: var(--si-label); line-height: 1.6; color: var(--si-secondary); padding-bottom: 0.5rem; }
  & .si-body { grid-area: body; max-width: var(--si-measure); line-height: var(--si-leading); margin-top: 3rem; display: flow-root; }
  & .si-body > :not(h2, h3, h4, h5, h6) + * { margin-top: 1.5rem; }
  & .si-body :is(h2, h3, h4, h5, h6) { line-height: 1.15; margin-block: 2.75rem 1rem; }
  & .si-body h2 { padding-top: 0.75rem; border-top: 1px solid var(--si-ink); font-size: var(--si-heading); }
  & .si-body h3 { font-size: var(--si-card); }
  & .si-body :is(h4, h5, h6) { font-size: var(--si-dek); }
  & .si-body strong { font-weight: 700; }
  & .si-body a { text-decoration-line: underline; }
  & .si-body u { text-decoration-style: dotted; }
  & .si-body :is(ul, ol) { padding-left: 1.5rem; }
  & .si-body ul { list-style-type: disc; }
  & .si-body ol { list-style-type: decimal; }
  & .si-body ol[type='a'] { list-style-type: lower-alpha; }
  & .si-body ol[type='A'] { list-style-type: upper-alpha; }
  & .si-body ol[type='i'] { list-style-type: lower-roman; }
  & .si-body ol[type='I'] { list-style-type: upper-roman; }
  & .si-body li::marker { font-family: var(--si-mono); }
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
  & .si-body [data-block='checklist'] > li { position: relative; padding-left: 1.75rem; }
  & .si-body [data-block='checklist'] > li > span[aria-hidden] { display: none; }
  & .si-body [data-block='checklist'] > li::before { content: ''; position: absolute; left: 0; top: 0.325em; width: 1em; height: 1em; box-sizing: border-box; border: 2px solid var(--si-ink); }
  & .si-body [data-block='checklist'] > li[data-checked='true']::before { background: var(--si-ink); }
  & .si-body [data-block='checklist'] > li > p { margin-top: 0; }
  & .si-body [data-block='callout'], & .si-body [data-block='embed'] { border: 1px solid var(--si-ink); padding: clamp(1rem, 3vw, 2rem); }
  & .si-body [data-block='callout'] > * + *, & .si-body [data-block='editorial'] > * + * { margin-top: 1rem; }
  & .si-body [data-block='callout'] > :first-child { font-family: var(--si-mono); font-size: var(--si-label); letter-spacing: 0.03em; text-transform: uppercase; }
  & .si-body [data-block='callout'] > :first-child strong { font-weight: 500; }
  & .si-body [data-block='callout'][data-variant='tip'] { background: var(--si-plate); }
  & .si-body [data-block='callout'][data-variant='warning'] { border-left: 4px solid var(--si-signal); }
  & .si-body [data-block='editorial'] > :first-child { margin-top: 0; }
  & .si-body [data-block='editorial']::before { content: attr(aria-label) / ''; display: block; margin-bottom: 1rem; font-family: var(--si-mono); font-size: var(--si-label); font-weight: 500; letter-spacing: 0.03em; line-height: 1.6; text-transform: uppercase; }
  & .si-body [data-variant='fact-box'] { padding: clamp(1rem, 3vw, 2rem); border: 1px solid transparent; background: var(--si-plate); }
  & .si-body [data-variant='key-points'], & .si-body [data-variant='related-stories'] { padding-top: 1rem; border-top: 4px solid var(--si-ink); }
  & .si-body [data-variant='methodology'] { padding-top: 1rem; border-top: 1px solid var(--si-ink); font-size: var(--si-copy); color: var(--si-secondary); }
  & .si-body [data-block='embed'] a { display: inline-block; min-height: 44px; padding-block: 0.5rem; font-size: var(--si-card); font-weight: 700; line-height: 1.15; letter-spacing: -0.035em; }
  & .si-body [data-block='embed'] a::after { content: '↗' / ''; margin-left: 0.25em; }
  & .si-body code { font-family: var(--si-mono); font-size: var(--si-copy); overflow-wrap: anywhere; }
  & .si-body pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: 1.25rem; border-block: 1px solid var(--si-ink); background: var(--si-plate); }
  & .si-body hr { border: 0; border-top: 4px solid var(--si-ink); margin-block: 3rem; }
  & .si-end { grid-area: end; margin-top: var(--si-space); border-top: 4px solid var(--si-ink); padding-top: 1rem; }
  & .si-end > div { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); column-gap: var(--si-gap); }
  & .si-end > div + div { margin-top: 1rem; }
  & .si-end dt { grid-column: 1; }
  & .si-end dd { grid-column: 2 / -1; }
  & .si-end dt, & .si-end dd { display: flex; align-items: center; min-height: 44px; }
  & .si-footer { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.5rem var(--si-gap); margin-top: var(--si-space); padding-block: 1.5rem 3rem; border-top: 4px solid var(--si-ink); }
  & .si-footer-name { font-size: var(--si-copy); font-weight: 700; }
  & .si-footer .si-nav { grid-column: 2 / -1; }
  & .si-footer .si-nav ul { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  & .si-top-link { grid-column: 1; justify-self: start; display: inline-flex; align-items: center; min-height: 44px; font-family: var(--si-mono); font-size: var(--si-small); text-decoration-line: underline; }
  @media (max-width: 1023px) {
    & .si-plates { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .si-index > li { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .si-row-copy, & .si-index-sectionless .si-row-copy { grid-column: 2; }
    & .si-row-facts-narrow { display: flex; margin-top: 0.25rem; }
    & .si-row-facts-wide { display: none; }
    & .si-number-plate[data-alone~='tablet'] { display: none; }
    & .si-empty, & .si-footer { grid-template-columns: 1fr; }
    & .si-empty > *, & .si-footer .si-nav { grid-column: 1; }
    & .si-footer .si-nav ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .si-article { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'head' 'rail' 'hero' 'body' 'end'; }
    & .si-rail { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin-top: 2rem; }
    & .si-rail > div + div { margin: 0; }
    & .si-rail a { align-items: flex-start; }
    & .si-hero-upright figure { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .si-hero-upright img { grid-column: 1; }
    & .si-hero-upright figcaption { grid-column: 2; }
    & .si-end > div { display: block; }
    & .si-end dt { min-height: 0; }
  }
  @media (max-width: 599px) {
    & .si-article-header h1, & .si-page-header h1 { letter-spacing: -0.04em; }
    & .si-masthead { padding-top: 1.5rem; }
    & .si-nav ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .si-nav li { padding-left: 0.5rem; }
    & .si-nav li[data-current] { padding-left: calc(0.5rem - 3px); }
    & .si-plates { grid-template-columns: 1fr; }
    & .si-plate-lead { grid-column: auto; }
    & .si-number-plate { display: none; }
    & .si-index > li { display: flex; flex-direction: column; }
    & .si-row-meta { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.75rem; }
    & .si-row-facts-narrow { display: contents; }
    & .si-hero-upright figure { display: block; }
    & .si-hero-upright figcaption { margin-top: 0.75rem; }
    & .si-body [data-block='gallery'] { grid-template-columns: 1fr; }
  }
  @media (min-width: 1024px) {
    & .si-number-plate[data-alone~='desktop'] { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    & .si-page *, & .si-page *::before, & .si-page *::after { scroll-behavior: auto; animation: none; transition: none; }
  }
  @media (forced-colors: active) {
    & .si-page :focus-visible { outline-color: Highlight; }
    & .si-state { border: 1px solid currentColor; }
    & .si-body [data-block='checklist'] > li[data-checked='true']::before { forced-color-adjust: none; background: CanvasText; border-color: CanvasText; }
  }
  @media print {
    & .si-skip, & .si-nav, & .si-theme, & .si-top-link, & .si-number-plate, & .si-related { display: none; }
    & .si-page main { width: 100%; }
    & .si-plates, & .si-index > li, & .si-empty, & .si-footer, & .si-article, & .si-end > div, & .si-hero-upright figure { display: block; }
    & .si-body { max-width: 65ch; }
  }
`
