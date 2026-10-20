/** Inlined by the active root only. All selectors remain inside that direction. */
export const styles = `
  & { background: var(--ll-paper); color: var(--ll-ink); }
  & .ll-page { min-height: 100vh; background: var(--ll-paper); font-family: var(--ll-serif); font-size: var(--ll-body); font-weight: 400; line-height: 1.65; overflow-wrap: anywhere; }
  & .ll-page * { box-sizing: border-box; }
  & .ll-page ::selection { background: var(--ll-accent); color: var(--ll-paper); }
  & .ll-page :where(h1, h2, h3, h4, h5, h6, p, ul, ol, figure, blockquote) { margin: 0; }
  & .ll-page :is(h1, h2, h3, h4, h5, h6) { font-family: var(--ll-serif); font-weight: 500; text-wrap: balance; }
  & .ll-page :where(ul, ol:not([type])) { padding: 0; list-style: none; }
  & .ll-page a { color: inherit; text-decoration: none; text-underline-offset: 0.2em; text-decoration-thickness: 1px; }
  & .ll-page a:visited { color: inherit; }
  & .ll-page a:hover { color: var(--ll-accent); text-decoration: underline; }
  & .ll-page a:focus-visible { color: var(--ll-accent); outline: 2px solid var(--ll-accent); outline-offset: 4px; }
  & .ll-page img { background: var(--ll-rule); border-radius: 0; }
  & .ll-page figcaption { margin-top: 0.75rem; max-width: 65ch; font-family: var(--ll-sans); font-size: var(--ll-small); font-style: normal; line-height: 1.65; color: var(--ll-secondary); }
  & .ll-page figcaption a { text-decoration: underline; }
  & .ll-skip { position: absolute; left: var(--ll-gutter); top: 1rem; z-index: 20; transform: translateY(-200%); background: var(--ll-paper); padding: 1rem; font-family: var(--ll-sans); font-size: var(--ll-small); }
  & .ll-skip:focus { transform: none; }
  & .ll-masthead { width: min(100% - var(--ll-gutter) * 2, var(--ll-page)); margin-inline: auto; padding-top: 1.5rem; text-align: center; }
  & .ll-page .ll-wordmark { font-size: var(--ll-wordmark); font-variant-caps: small-caps; font-weight: 500; letter-spacing: 0.055em; line-height: 1.2; padding-bottom: 1.25rem; }
  & .ll-wordmark a { display: inline-flex; align-items: center; min-height: 44px; }
  & .ll-masthead nav { border-top: 1px solid var(--ll-rule); border-bottom: 1px solid var(--ll-ink); padding-block: 0.375rem; }
  & .ll-masthead ul { display: flex; flex-wrap: wrap; justify-content: center; column-gap: clamp(0.75rem, 2.5vw, 2.5rem); }
  & .ll-masthead nav a { display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; font-family: var(--ll-sans); font-size: var(--ll-small); padding: 0.5rem 0.25rem; }
  & .ll-masthead nav a[aria-current] { text-decoration: underline; text-decoration-color: var(--ll-accent); text-underline-offset: 0.5em; }
  & .ll-page main { width: min(100% - var(--ll-gutter) * 2, var(--ll-page)); margin-inline: auto; }
  & .ll-page .ll-label { font-family: var(--ll-sans); font-size: var(--ll-label); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ll-accent); line-height: 1.5; }
  & .ll-label a { display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; }
  & .ll-cover { display: grid; grid-template-columns: minmax(0, 1fr); margin-top: 2rem; }
  & .ll-cover-panel { min-width: 0; padding: 1.5rem; background: var(--ll-panel); color: var(--ll-panel-ink); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; }
  & .ll-cover .ll-label { color: var(--ll-gold); }
  & .ll-page .ll-cover-title { font-size: var(--ll-cover-title); font-weight: 400; line-height: 1.1; max-width: 20ch; margin-top: 1rem; }
  & .ll-cover-title a { display: block; min-height: 44px; }
  & .ll-cover-panel a:hover { color: var(--ll-gold); }
  & .ll-cover-panel a:focus-visible { color: var(--ll-gold); outline-color: var(--ll-gold); }
  & .ll-cover-panel ::selection { background: var(--ll-gold); color: var(--ll-panel); }
  & .ll-cover-dek { margin-top: 1.5rem; font-size: var(--ll-dek); font-style: italic; line-height: 1.45; max-width: 48ch; }
  & .ll-cover-panel .ll-meta { color: var(--ll-panel-ink); }
  & .ll-page .ll-read { display: inline-flex; gap: 1rem; align-items: center; min-height: 44px; font-family: var(--ll-sans); font-size: var(--ll-small); margin-top: 1.5rem; border-bottom: 1px solid var(--ll-gold); }
  & .ll-cover-image { min-width: 0; display: flex; flex-direction: column; background: var(--ll-paper); }
  & .ll-image-frame { position: relative; width: 100%; aspect-ratio: 4 / 3; }
  & .ll-image-frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: var(--ll-focal-point, 50% 50%); }
  & .ll-image-frame > div { position: absolute; inset: 0; height: 100%; aspect-ratio: auto; }
  & .ll-cover-text { grid-template-columns: 1fr; }
  & .ll-cover-text .ll-cover-panel { align-items: center; text-align: center; }
  & .ll-cover-text .ll-cover-title { max-width: 26ch; }
  & .ll-featured { margin-top: var(--ll-space); }
  & .ll-section-label { padding-bottom: 1.25rem; border-bottom: 1px solid var(--ll-rule); margin-bottom: 1.75rem; }
  & .ll-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2.5rem; }
  & .ll-grid > li, & .ll-card { min-width: 0; }
  & .ll-card-image { margin-bottom: 0.75rem; }
  & .ll-card-text { border-top: 3px solid var(--ll-accent); padding-top: 1rem; }
  & .ll-card-title { font-size: var(--ll-card); line-height: 1.2; max-width: 32ch; }
  & .ll-card-title a { display: block; min-height: 44px; padding-block: 0.25rem; }
  & .ll-card-dek { margin-top: 0.75rem; max-width: 52ch; font-size: var(--ll-card-dek); line-height: 1.5; color: var(--ll-secondary); }
  & .ll-date, & .ll-meta { font-family: var(--ll-sans); font-size: var(--ll-small); color: var(--ll-secondary); line-height: 1.65; }
  & .ll-meta { margin-top: 1rem; }
  & .ll-latest { margin-top: var(--ll-space); border-top: 1px solid var(--ll-ink); padding-top: 1.5rem; display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; }
  & .ll-latest > h2 { font-size: var(--ll-heading); }
  & .ll-latest li { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0.25rem; padding-block: 1.5rem; border-bottom: 1px solid var(--ll-rule); }
  & .ll-latest li:first-child { padding-top: 0; }
  & .ll-latest li > div { min-width: 0; }
  & .ll-empty { min-height: 55vh; max-width: 40rem; margin-inline: auto; padding-block: var(--ll-space); text-align: center; }
  & .ll-empty h2 { font-size: var(--ll-title); line-height: 1.1; }
  & .ll-empty p { margin-top: 1.5rem; color: var(--ll-secondary); }
  & .ll-article-header { max-width: 58rem; margin: var(--ll-space) auto 3rem; text-align: left; }
  & .ll-article-header h1 { font-size: var(--ll-title); line-height: 1.08; max-width: 22ch; margin: 1rem 0 0; }
  & .ll-dek { font-size: var(--ll-dek); font-style: italic; font-weight: 400; line-height: 1.45; max-width: 48ch; margin: 1.5rem 0 0; }
  & .ll-byline { font-family: var(--ll-sans); font-size: var(--ll-small); color: var(--ll-secondary); line-height: 1.65; margin-top: 1.75rem; }
  & .ll-byline > p + p { margin-top: 0.5rem; }
  & .ll-page :is(.ll-byline, .ll-authors, .ll-topics, .ll-article-exit, .ll-section-empty) a { display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; max-width: 100%; text-decoration: underline; color: var(--ll-ink); }
  & .ll-page :is(.ll-byline, .ll-authors, .ll-topics, .ll-article-exit, .ll-section-empty) a:is(:hover, :focus-visible) { color: var(--ll-accent); }
  & .ll-hero { max-width: 60rem; margin: 0 auto 3rem; }
  & .ll-hero figcaption { max-width: min(100%, 65ch, 42rem); margin-inline: auto; }
  & .ll-body { width: min(100%, 42rem); margin-inline: auto; line-height: var(--ll-leading); display: flow-root; }
  & .ll-body > :where(p, h2, h3, h4, h5, h6, ul:not([data-block='gallery']), ol, blockquote, pre, div, section, figure[data-block='embed']) { max-width: 65ch; margin-inline: auto; }
  & .ll-body > * + * { margin-top: 1.5rem; }
  & .ll-body :is(h2, h3, h4, h5, h6) { font-weight: 600; line-height: 1.2; margin-block: 2.75rem 1rem; }
  & .ll-body h2 { font-size: var(--ll-heading); }
  & .ll-body h3 { font-size: var(--ll-subheading); }
  & .ll-body :is(h4, h5, h6) { line-height: 1.3; }
  & .ll-body h4 { font-size: 1.5rem; }
  & .ll-body h5 { font-size: 1.375rem; }
  & .ll-body h6 { font-size: 1.25rem; }
  & .ll-body strong { font-weight: 600; }
  & .ll-body a { text-decoration: underline; }
  & .ll-body :is(ul, ol) { padding-left: 1.5rem; }
  & .ll-body ul { list-style-type: disc; }
  & .ll-body ol:not([type]) { list-style-type: decimal; }
  & .ll-body li + li { margin-top: 0.5rem; }
  & .ll-body li > * + * { margin-top: 0.75rem; }
  & .ll-body blockquote { border-left: 2px solid var(--ll-accent); padding-left: 1.5rem; }
  & .ll-body blockquote > * + * { margin-top: 1.5rem; }
  & .ll-body figure:has(picture), & .ll-body [data-block='gallery'] { margin-block: 3rem; max-width: 100%; }
  & .ll-body [data-block='pull-quote'] { padding-block: 2rem; margin-block: 2.75rem; border-block: 1px solid var(--ll-rule); text-align: center; }
  & .ll-body [data-block='pull-quote'] blockquote { border: 0; padding: 0; font-size: var(--ll-quote); font-style: italic; line-height: 1.3; max-width: 34ch; margin-inline: auto; }
  & .ll-body [data-block='pull-quote'] figcaption { margin-inline: auto; }
  & .ll-body [data-block='gallery'] { list-style: none; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  & .ll-body [data-block='gallery'] li { min-width: 0; margin: 0; }
  & .ll-body [data-block='gallery'] figure { margin: 0; }
  & .ll-body [data-layout='carousel'] { grid-template-columns: 1fr; }
  & .ll-body [data-block='checklist'] { list-style: none; padding: 0; }
  & .ll-body [data-block='checklist'] li { position: relative; padding-left: 1.75rem; }
  & .ll-body [data-block='checklist'] li > span[aria-hidden] { position: absolute; left: 0; top: 0; color: var(--ll-ink); }
  & .ll-body [data-block='checklist'] li > p { margin-top: 0; }
  & .ll-body :is([data-block='callout'], [data-block='editorial'], [data-block='embed']) { padding: var(--ll-inset); background: var(--ll-surface); border: 1px solid var(--ll-border); }
  & .ll-body [data-variant='key-points'] { background: var(--ll-paper); border: 0; border-left: 2px solid var(--ll-accent); }
  & .ll-body [data-variant='methodology'] { border: 0; border-block: 1px solid var(--ll-rule); }
  & .ll-body [data-variant='related-stories'] { background: var(--ll-paper); border: 0; border-top: 1px solid var(--ll-rule); }
  & .ll-body :is([data-block='callout'], [data-block='editorial']) > * + * { margin-top: 1rem; }
  & .ll-body [data-block='editorial'] > :first-child { margin-top: 0; }
  & .ll-body [data-block='embed'] a { display: inline-block; min-height: 44px; padding-block: 0.5rem; }
  & .ll-body code { font-family: ui-monospace, monospace; font-size: var(--ll-code); line-height: inherit; overflow-wrap: anywhere; background: var(--ll-surface); }
  & .ll-body pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: var(--ll-code); line-height: 1.6; padding: var(--ll-inset); background: var(--ll-surface); }
  & .ll-body hr { width: 4rem; border: 0; border-top: 1px solid var(--ll-accent); margin: 3rem auto; }
  & .ll-end-matter { margin-top: 3rem; }
  & .ll-end-matter > * + * { margin-top: 2rem; }
  & .ll-closing-rule { width: 4rem; border-top: 1px solid var(--ll-accent); margin-inline: auto; }
  & .ll-authors, & .ll-topics, & .ll-article-exit { max-width: 42rem; margin-inline: auto; }
  & .ll-end-matter h2, & .ll-index-heading { font-size: var(--ll-heading); line-height: 1.2; margin-bottom: 1rem; }
  & .ll-topics ul { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; }
  & .ll-related-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
  & .ll-related-grid > li { min-width: 0; }
  & .ll-article-exit { font-family: var(--ll-sans); font-size: var(--ll-small); }
  & .ll-section-header { padding-block: var(--ll-space); max-width: 58rem; }
  & .ll-section-header h1 { font-size: var(--ll-title); line-height: 1.08; max-width: 22ch; margin-top: 1rem; }
  & .ll-section-header .ll-dek { margin-left: 0; }
  & .ll-entity-description { max-width: min(65ch, 42rem); margin-top: 1.5rem; color: var(--ll-secondary); white-space: pre-line; }
  & .ll-index { border-top: 1px solid var(--ll-ink); }
  & .ll-index-row { display: grid; grid-template-columns: minmax(0, 1fr) 5rem; grid-template-rows: auto 1fr; gap: 0.75rem 1rem; padding-block: 2rem; border-bottom: 1px solid var(--ll-rule); align-items: start; }
  & .ll-index-row > .ll-date { grid-column: 1; grid-row: 1; }
  & .ll-index-copy { min-width: 0; grid-column: 1; grid-row: 2; }
  & .ll-index-copy :is(h2, h3) { font-size: var(--ll-index-title); line-height: 1.2; max-width: 36ch; }
  & .ll-index-copy :is(h2, h3) a { display: block; min-height: 44px; }
  & .ll-index-image { min-width: 0; grid-column: 2; grid-row: 1 / span 2; }
  & .ll-index-text { grid-template-columns: minmax(0, 1fr); }
  & .ll-section-empty { color: var(--ll-secondary); padding-block: 2rem var(--ll-space); border-top: 1px solid var(--ll-rule); }
  & .ll-section-empty a { display: inline-flex; align-items: center; min-height: 44px; margin-top: 1rem; color: var(--ll-ink); text-decoration: underline; }
  & .ll-footer { width: min(100% - var(--ll-gutter) * 2, var(--ll-page)); margin: var(--ll-space) auto 0; padding-block: 2rem; border-top: 1px solid var(--ll-ink); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem 2rem; }
  & .ll-footer-brand { font-variant-caps: small-caps; letter-spacing: 0.05em; }
  & .ll-footer a { display: inline-flex; align-items: center; gap: 1rem; min-height: 44px; font-family: var(--ll-sans); font-size: var(--ll-small); }
  @media (min-width: 768px) {
    & { --ll-gutter: 1.5rem; --ll-space: 4rem; --ll-body: 1.25rem; --ll-wordmark: 2.25rem; --ll-title: 3.5rem; --ll-cover-title: 2.5rem; --ll-dek: 1.625rem; --ll-card: 1.875rem; --ll-index-title: 1.875rem; --ll-heading: 2.25rem; --ll-subheading: 1.875rem; --ll-quote: 2rem; --ll-code: 1rem; --ll-inset: 1.5rem; }
    & .ll-masthead { padding-top: 2rem; }
    & .ll-cover:not(.ll-cover-text) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .ll-cover-image .ll-image-frame { aspect-ratio: 4 / 5; flex: 1 0 auto; }
    & .ll-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
    & .ll-latest li { grid-template-columns: 6rem minmax(0, 1fr); gap: 1.5rem; }
    & .ll-latest .ll-date { padding-top: 0.75rem; }
    & .ll-index-row { grid-template-columns: minmax(0, 1fr) 6rem; column-gap: 1.5rem; }
    & .ll-index-text { grid-template-columns: minmax(0, 1fr); }
    & .ll-article-header { text-align: center; }
    & .ll-article-header :is(h1, .ll-dek) { margin-inline: auto; }
    & .ll-body > p:first-child::first-letter { float: left; font-size: var(--ll-dropcap); line-height: 0.85; font-weight: 500; color: var(--ll-accent); padding: 0.08em 0.1em 0 0; }
    & .ll-body [data-block='gallery']:not([data-layout='carousel']) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .ll-footer { padding-block: 3rem; }
  }
  @media (min-width: 1024px) {
    & { --ll-gutter: 3rem; --ll-space: 6rem; --ll-wordmark: 2.75rem; --ll-title: 4.5rem; --ll-cover-title: 3.5rem; --ll-dek: 1.75rem; --ll-card: 2.125rem; --ll-card-dek: 1.25rem; --ll-index-title: 2.25rem; --ll-heading: 2.5rem; --ll-subheading: 2rem; --ll-quote: 2.5rem; }
    & .ll-masthead { padding-top: 3rem; }
    & .ll-cover-panel { padding: 3rem; }
    & .ll-latest { grid-template-columns: 12rem minmax(0, 1fr); gap: 2rem; }
    & .ll-index-row { grid-template-columns: 8rem minmax(0, 1fr) 10rem; grid-template-rows: auto; }
    & .ll-index-row > .ll-date { padding-top: 0.5rem; }
    & .ll-index-copy { grid-column: 2; grid-row: 1; }
    & .ll-index-image { grid-column: 3; grid-row: 1; }
    & .ll-index-text { grid-template-columns: 8rem minmax(0, 1fr); }
    & .ll-related-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (prefers-reduced-motion: reduce) {
    & .ll-page *, & .ll-page *::before, & .ll-page *::after { scroll-behavior: auto; animation: none; transition: none; }
  }
  @media (forced-colors: active) {
    & .ll-page a:focus-visible { outline-color: Highlight; }
  }
  @media print {
    & .ll-skip, & .ll-masthead nav, & .ll-footer { display: none; }
    & .ll-page main { width: 100%; }
    & .ll-body { max-width: 65ch; }
  }
`
