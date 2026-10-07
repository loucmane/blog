/** Inlined by the active root only. All selectors remain inside that direction. */
export const styles = `
  & { background: var(--ll-paper); color: var(--ll-ink); }
  & .ll-page { min-height: 100vh; font-family: var(--ll-serif); font-size: var(--ll-body); font-weight: 400; line-height: 1.5; overflow-wrap: anywhere; }
  & .ll-page * { box-sizing: border-box; }
  & .ll-page ::selection { background: var(--ll-accent); color: var(--ll-paper); }
  & .ll-page :where(h1, h2, h3, h4, h5, h6, p, ul, ol, figure, blockquote) { margin: 0; }
  & .ll-page :is(h1, h2, h3, h4, h5, h6) { font-family: var(--ll-serif); font-weight: 500; text-wrap: balance; }
  & .ll-page :is(ul, ol) { padding: 0; list-style: none; }
  & .ll-page a { color: inherit; text-decoration: none; text-underline-offset: 0.2em; text-decoration-thickness: 1px; }
  & .ll-page a:hover { color: var(--ll-accent); text-decoration: underline; }
  & .ll-page a:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  & .ll-page img { background: var(--ll-rule); border-radius: 0; }
  & .ll-page figcaption { margin-top: 0.75rem; font-family: var(--ll-sans); font-size: var(--ll-small); font-style: normal; line-height: 1.7; color: var(--ll-secondary); }
  & .ll-page figcaption a { display: inline-block; min-height: 44px; padding-block: 0.625rem; text-decoration: underline; }
  & .ll-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  & .ll-skip { position: absolute; left: var(--ll-gutter); top: 1rem; z-index: 20; transform: translateY(-200%); background: var(--ll-paper); padding: 1rem; font-family: var(--ll-sans); font-size: var(--ll-small); }
  & .ll-skip:focus { transform: none; }
  & .ll-masthead { width: min(100% - var(--ll-gutter) * 2, var(--ll-page)); margin-inline: auto; padding-top: clamp(1.5rem, 3vw, 3rem); text-align: center; }
  & .ll-page .ll-wordmark { font-size: var(--ll-wordmark); font-variant-caps: small-caps; font-weight: 500; letter-spacing: 0.055em; line-height: 1.2; padding-bottom: 1.25rem; }
  & .ll-wordmark a { display: inline-flex; align-items: center; min-height: 44px; }
  & .ll-masthead nav { border-top: 1px solid var(--ll-rule); border-bottom: 1px solid var(--ll-ink); padding-block: 0.375rem; }
  & .ll-masthead ul { display: flex; flex-wrap: wrap; justify-content: center; column-gap: clamp(0.75rem, 2.5vw, 2.5rem); }
  & .ll-masthead nav a { display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; font-family: var(--ll-sans); font-size: var(--ll-small); padding: 0.5rem 0.25rem; }
  & .ll-masthead nav a[aria-current] { text-decoration: underline; text-decoration-color: var(--ll-accent); text-underline-offset: 0.5em; }
  & .ll-page main { width: min(100% - var(--ll-gutter) * 2, var(--ll-page)); margin-inline: auto; }
  & .ll-page .ll-label { font-family: var(--ll-sans); font-size: var(--ll-label); font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: var(--ll-accent); line-height: 1.6; }
  & .ll-label a { display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; }
  & .ll-cover { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 2rem; background: var(--ll-panel); color: var(--ll-panel-ink); }
  & .ll-cover-panel { padding: clamp(1.5rem, 4vw, 4rem); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; }
  & .ll-cover .ll-label { color: var(--ll-gold); }
  & .ll-page .ll-cover-title { font-size: var(--ll-cover-title); font-weight: 400; line-height: 1.07; text-transform: uppercase; margin-top: 1rem; text-wrap: pretty; }
  & .ll-cover-title a { display: block; min-height: 44px; }
  & .ll-cover a:hover { color: var(--ll-gold); }
  & .ll-cover-dek { margin-top: 1.75rem; font-size: var(--ll-body); line-height: 1.5; max-width: 42ch; }
  & .ll-page .ll-read { display: inline-flex; gap: 1rem; align-items: center; min-height: 44px; font-family: var(--ll-sans); font-size: var(--ll-small); margin-top: 1.5rem; border-bottom: 1px solid var(--ll-gold); }
  & .ll-cover-image { position: relative; min-height: 28rem; }
  & .ll-cover-image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  & .ll-cover-image > div { height: 100%; }
  & .ll-cover-text { grid-template-columns: 1fr; }
  & .ll-cover-text .ll-cover-panel { padding-block: var(--ll-space); align-items: center; text-align: center; }
  & .ll-cover-text .ll-cover-title { max-width: 26ch; }
  & .ll-featured { margin-top: var(--ll-space); }
  & .ll-section-label { padding-bottom: 1.25rem; border-bottom: 1px solid var(--ll-rule); margin-bottom: 1.75rem; }
  & .ll-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 2rem; }
  & .ll-card { min-width: 0; }
  & .ll-card-image { position: relative; aspect-ratio: 4 / 3; margin-bottom: 0.75rem; }
  & .ll-card-image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  & .ll-card-image > div { height: 100%; }
  & .ll-card-text { border-top: 3px solid var(--ll-accent); padding-top: 1rem; }
  & .ll-card-title { font-size: var(--ll-card); line-height: 1.15; }
  & .ll-card-title a { display: block; min-height: 44px; padding-block: 0.25rem; }
  & .ll-card-dek { margin-top: 0.75rem; color: var(--ll-secondary); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
  & .ll-date { font-family: var(--ll-sans); font-size: var(--ll-small); color: var(--ll-secondary); line-height: 1.7; }
  & .ll-latest { margin-top: var(--ll-space); border-top: 1px solid var(--ll-ink); padding-top: 1.5rem; display: grid; grid-template-columns: 1fr 3fr; gap: 2rem; }
  & .ll-latest > h2 { font-size: var(--ll-heading); }
  & .ll-latest li { display: grid; grid-template-columns: 8rem minmax(0, 1fr); gap: 1.5rem; padding-block: 1.25rem; border-bottom: 1px solid var(--ll-rule); }
  & .ll-latest li:first-child { padding-top: 0; }
  & .ll-latest .ll-date { padding-top: 0.75rem; }
  & .ll-empty { min-height: 55vh; max-width: 40rem; margin-inline: auto; padding-block: var(--ll-space); text-align: center; }
  & .ll-empty h2 { font-size: var(--ll-title); line-height: 1.1; }
  & .ll-empty p { margin-top: 1.5rem; color: var(--ll-secondary); }
  & .ll-article-header { max-width: 58rem; margin: var(--ll-space) auto 2.5rem; padding-bottom: 2rem; border-bottom: 1px solid var(--ll-rule); text-align: center; }
  & .ll-article-header h1 { font-size: var(--ll-title); line-height: 1.05; margin-top: 1rem; }
  & .ll-dek { font-size: var(--ll-dek); font-style: italic; font-weight: 400; line-height: 1.45; max-width: 48ch; margin: 1.5rem auto 0; }
  & .ll-byline { font-family: var(--ll-sans); font-size: var(--ll-small); color: var(--ll-secondary); line-height: 1.9; margin-top: 1.75rem; }
  & .ll-byline > p + p { margin-top: 0.5rem; }
  & .ll-hero { max-width: 60rem; margin: 0 auto 3rem; }
  & .ll-body { max-width: var(--ll-measure); margin-inline: auto; line-height: var(--ll-leading); display: flow-root; }
  & .ll-body > * + * { margin-top: 1.5rem; }
  & .ll-body > p:first-of-type::first-letter { float: left; font-size: var(--ll-dropcap); line-height: 0.85; font-weight: 500; color: var(--ll-accent); padding: 0.08em 0.1em 0 0; }
  & .ll-body :is(h2, h3, h4, h5, h6) { font-weight: 600; line-height: 1.2; margin-block: 2.75rem 1rem; }
  & .ll-body h2 { font-size: var(--ll-heading); }
  & .ll-body h3 { font-size: var(--ll-card); }
  & .ll-body :is(h4, h5, h6) { font-size: var(--ll-dek); }
  & .ll-body strong { font-weight: 600; }
  & .ll-body a { text-decoration: underline; }
  & .ll-body :is(ul, ol) { padding-left: 1.5rem; }
  & .ll-body ul { list-style-type: disc; }
  & .ll-body ol { list-style-type: decimal; }
  & .ll-body ol[type='a'] { list-style-type: lower-alpha; }
  & .ll-body ol[type='A'] { list-style-type: upper-alpha; }
  & .ll-body ol[type='i'] { list-style-type: lower-roman; }
  & .ll-body ol[type='I'] { list-style-type: upper-roman; }
  & .ll-body li + li { margin-top: 0.5rem; }
  & .ll-body li > * + * { margin-top: 0.75rem; }
  & .ll-body blockquote { border-left: 2px solid var(--ll-accent); padding-left: 1.5rem; }
  & .ll-body blockquote > * + * { margin-top: 1.25rem; }
  & .ll-body > figure:has(picture), & .ll-body > [data-block='gallery'] { width: min(42rem, 100vw - var(--ll-gutter) * 2); max-width: none; margin-block: 3rem; margin-left: 50%; transform: translateX(-50%); }
  & .ll-body [data-block='pull-quote'] { padding-block: 2rem; margin-block: 2.75rem; border-block: 1px solid var(--ll-rule); text-align: center; }
  & .ll-body [data-block='pull-quote'] blockquote { border: 0; padding: 0; font-size: var(--ll-heading); font-style: italic; line-height: 1.25; }
  & .ll-body [data-block='gallery'] { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem 1.5rem; align-items: start; }
  & .ll-body [data-block='gallery'] li { min-width: 0; margin: 0; }
  & .ll-body [data-layout='carousel'] { grid-template-columns: 1fr; }
  & .ll-body [data-block='checklist'] { list-style: none; padding: 0; }
  & .ll-body [data-block='checklist'] li { position: relative; padding-left: 1.75rem; }
  & .ll-body [data-block='checklist'] li > span[aria-hidden] { position: absolute; left: 0; top: 0; }
  & .ll-body [data-block='checklist'] li > p { margin-top: 0; }
  & .ll-body :is([data-block='callout'], [data-block='editorial'], [data-block='embed']) { padding: clamp(1.25rem, 3vw, 2rem); border: 1px solid var(--ll-rule); }
  & .ll-body :is([data-block='callout'], [data-block='editorial']) > * + * { margin-top: 1rem; }
  & .ll-body [data-block='editorial'] > :first-child { margin-top: 0; }
  & .ll-body [data-block='embed'] a { display: inline-block; min-height: 44px; padding-block: 0.5rem; }
  & .ll-body code { font-family: ui-monospace, monospace; font-size: 0.85em; overflow-wrap: anywhere; }
  & .ll-body pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: 1.25rem; border-block: 1px solid var(--ll-rule); }
  & .ll-body hr { width: 4rem; border: 0; border-top: 1px solid var(--ll-accent); margin: 3rem auto; }
  & .ll-section-header { padding-block: var(--ll-space); max-width: 55rem; }
  & .ll-section-header h1 { font-size: var(--ll-title); line-height: 1.05; margin-top: 1rem; }
  & .ll-section-header .ll-dek { margin-left: 0; }
  & .ll-index { border-top: 1px solid var(--ll-ink); }
  & .ll-index-row { display: grid; grid-template-columns: 8rem minmax(0, 1fr) 10rem; gap: 2rem; padding-block: 2rem; border-bottom: 1px solid var(--ll-rule); align-items: start; }
  & .ll-index-row > .ll-date { padding-top: 0.5rem; }
  & .ll-index-copy h2 { font-size: var(--ll-heading); line-height: 1.15; }
  & .ll-index-copy h2 a { display: block; min-height: 44px; }
  & .ll-index-copy p { margin-top: 0.75rem; max-width: 52ch; color: var(--ll-secondary); }
  & .ll-index-image { position: relative; aspect-ratio: 4 / 3; }
  & .ll-index-image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  & .ll-index-image > div { height: 100%; }
  & .ll-index-text .ll-index-copy { grid-column: 2 / -1; }
  & .ll-section-empty { color: var(--ll-secondary); padding-block: 2rem var(--ll-space); border-top: 1px solid var(--ll-rule); }
  & .ll-footer { width: min(100% - var(--ll-gutter) * 2, var(--ll-page)); margin: var(--ll-space) auto 0; padding-block: 2rem 3rem; border-top: 1px solid var(--ll-ink); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem 2rem; }
  & .ll-footer-brand { font-variant-caps: small-caps; letter-spacing: 0.05em; }
  & .ll-footer a { display: inline-flex; align-items: center; gap: 1rem; min-height: 44px; font-family: var(--ll-sans); font-size: var(--ll-small); }
  @media (max-width: 1023px) {
    & .ll-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .ll-latest { grid-template-columns: 1fr; gap: 1rem; }
  }
  @media (max-width: 767px) {
    & .ll-cover { grid-template-columns: 1fr; }
    & .ll-cover-image { min-height: 0; aspect-ratio: 4 / 3; }
    & .ll-cover-panel { padding-block: 2rem; }
    & .ll-index-row { grid-template-columns: minmax(0, 1fr) 5rem; gap: 0.75rem 1rem; }
    & .ll-index-row > .ll-date { grid-column: 1 / -1; padding: 0; }
    & .ll-index-copy { grid-column: 1; }
    & .ll-index-copy h2 { font-size: var(--ll-card); }
    & .ll-index-text .ll-index-copy { grid-column: 1 / -1; }
    & .ll-body [data-block='gallery'] { grid-template-columns: 1fr; }
  }
  @media (max-width: 599px) {
    & .ll-grid { grid-template-columns: 1fr; gap: 2.5rem; }
    & .ll-latest li { grid-template-columns: 1fr; gap: 0.25rem; }
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
