import { storyColours } from './colours'

/** Only the active reader root emits this CSS; shared pages import no assets. */
export const styles = `
  & { background: var(--ec-paper); color: var(--ec-ink); color-scheme: light; }
  ${storyColours.map(({ name }) => `& [data-story-colour='${name}'] { --ec-story: var(--ec-${name}); --ec-on-story: var(--ec-on-${name}); }`).join('\n')}
  & .ec-page { max-width: var(--ec-page); margin-inline: auto; padding-inline: var(--ec-gutter); min-height: 100vh; font-family: var(--ec-serif); font-size: var(--ec-body); font-weight: 400; font-variation-settings: 'SOFT' 30; line-height: 1.5; overflow-wrap: anywhere; }
  & .ec-page * { box-sizing: border-box; min-width: 0; }
  & .ec-page :where(h1, h2, h3, h4, h5, h6, p, ul, ol, figure, blockquote) { margin: 0; }
  & .ec-page :is(h1, h2, h3, h4, h5, h6) { font-family: var(--ec-serif); font-weight: 800; font-variation-settings: 'SOFT' 100; letter-spacing: -0.035em; line-height: 1.08; text-wrap: pretty; }
  & .ec-page :is(ul, ol) { list-style: none; padding: 0; }
  & .ec-page a { color: inherit; text-decoration: none; text-underline-offset: 0.2em; }
  & .ec-page a:hover { text-decoration: underline; }
  & .ec-page :focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }
  & .ec-page ::selection { background: var(--ec-ink); color: var(--ec-paper); }
  & .ec-page .ec-skip { position: absolute; top: 1rem; left: 1rem; z-index: 20; transform: translateY(-200%); padding: 1rem; border-radius: 0.5rem; background: var(--ec-ink); color: var(--ec-paper); font: 400 var(--ec-small)/1.5 var(--ec-mono); }
  & .ec-skip:focus { transform: none; }
  & .ec-masthead { padding-block: 2rem; }
  & .ec-page .ec-wordmark { font-size: var(--ec-wordmark); font-weight: 900; font-variation-settings: 'SOFT' 100; line-height: 1.05; letter-spacing: -0.06em; }
  & .ec-wordmark a { display: inline-block; padding-block: 0.25rem; min-height: 44px; }
  & .ec-wordmark em { font-weight: 700; }
  & .ec-masthead nav { margin-top: 1.5rem; }
  & .ec-masthead ul { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  & .ec-masthead li { max-width: 100%; }
  & .ec-masthead nav a, & .ec-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0.75rem 1.125rem; border: 1px solid currentColor; border-radius: 2rem; font: 400 var(--ec-label)/1.6 var(--ec-mono); }
  & .ec-masthead nav a[aria-current='page'] { background: var(--ec-ink); color: var(--ec-paper); font-weight: 500; }
  /* Filled pills keep their ring inside the contrasting fill, not white on paper. */
  & .ec-masthead nav a[aria-current='page']:focus-visible { outline-offset: -5px; }
  & .ec-label, & .ec-card-meta, & .ec-card-bottom, & .ec-article-meta, & .ec-credits { font: 400 var(--ec-label)/1.8 var(--ec-mono); }
  & .ec-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ec-gap); align-items: stretch; }
  & .ec-card { background: var(--ec-story); color: var(--ec-on-story); border-radius: var(--ec-radius); }
  & .ec-card-link { display: flex; flex-direction: column; height: 100%; padding: clamp(1.25rem, 2vw, 2rem); gap: 1.5rem; border-radius: inherit; }
  & .ec-page .ec-card-link:hover { text-decoration: none; }
  & .ec-card-link:hover h2 { text-decoration: underline; text-decoration-thickness: 2px; }
  & .ec-card-link:focus-visible { outline-offset: -7px; }
  & .ec-card-copy { display: flex; flex-direction: column; gap: 1.25rem; flex: 1; }
  & .ec-card-meta { display: flex; flex-wrap: wrap; gap: 0.5rem 0.75rem; align-items: center; }
  & .ec-number { display: inline-flex; justify-content: center; align-items: center; width: 2.75rem; height: 2.75rem; flex-shrink: 0; border: 1px solid currentColor; border-radius: 50%; font-weight: 500; }
  & .ec-card-meta > :last-child { margin-left: auto; }
  & .ec-card h2 { font-size: var(--ec-card); }
  & .ec-card-dek { font-size: var(--ec-copy); line-height: 1.5; }
  & .ec-card-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; align-items: center; margin-top: auto; padding-top: 0.5rem; }
  & .ec-read { display: inline-flex; gap: 1rem; align-items: center; min-height: 44px; font-weight: 500; }
  & .ec-read > span { font: 400 1.5rem/1 var(--ec-serif); }
  & .ec-card-visual { position: relative; aspect-ratio: 4/3; width: 100%; overflow: hidden; border-radius: 0.75rem; align-self: center; }
  & .ec-card-visual picture, & .ec-card-visual > div { object-position: inherit; }
  & .ec-card-visual > div { height: 100%; }
  & .ec-card-visual img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: inherit; border-radius: inherit; }
  & .ec-motif { display: block; width: 100%; height: 100%; border: 1px solid currentColor; border-radius: inherit; }
  & .ec-card-lead { grid-column: 1/-1; }
  & .ec-card-lead .ec-card-link { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(2rem, 4vw, 4rem); padding: clamp(1.5rem, 3vw, 3rem); }
  & .ec-card-lead h2 { font-size: var(--ec-lead); }
  & .ec-card-lead .ec-card-dek { font-size: var(--ec-dek); font-style: italic; }
  & .ec-card-lead .ec-card-copy { gap: 1.5rem; }
  & .ec-article-band { background: var(--ec-story); color: var(--ec-on-story); border-radius: var(--ec-radius); padding: clamp(1.5rem, 5vw, 5rem); }
  & .ec-article-meta { display: flex; flex-wrap: wrap; gap: 1rem 2rem; align-items: center; margin-bottom: 2rem; }
  & .ec-article-band h1 { font-size: var(--ec-title); max-width: 22ch; }
  & .ec-article-intro { max-width: var(--ec-measure); margin: 3rem auto; font-size: var(--ec-body); }
  & .ec-dek { font-size: var(--ec-dek); font-style: italic; line-height: 1.45; }
  & .ec-credits { display: flex; flex-wrap: wrap; gap: 0.75rem 2rem; margin-top: 1.5rem; }
  & .ec-hero { margin-block: 2rem var(--ec-space); }
  & .ec-hero img { display: block; border-radius: var(--ec-radius); }
  & .ec-page figcaption { font: 400 var(--ec-small)/1.8 var(--ec-mono); margin-top: 0.875rem; }
  & .ec-page figcaption a { display: inline-block; min-height: 44px; padding-block: 0.5rem; text-decoration: underline; }
  & .ec-body { max-width: var(--ec-measure); margin-inline: auto; font-size: var(--ec-body); line-height: var(--ec-leading); display: flow-root; }
  & .ec-body > * + * { margin-top: 1.5rem; }
  & .ec-body :is(h2, h3, h4, h5, h6) { margin-block: 3rem 1rem; }
  & .ec-body h2 { font-size: var(--ec-heading); }
  & .ec-body h3 { font-size: var(--ec-dek); }
  & .ec-body :is(h4, h5, h6) { font-size: var(--ec-body); }
  & .ec-body strong { font-weight: 700; }
  & .ec-body a { text-decoration: underline; text-decoration-thickness: 1px; }
  & .ec-body :is(ul, ol) { padding-left: 1.5rem; }
  & .ec-body ul { list-style-type: disc; }
  & .ec-body ol { list-style-type: decimal; }
  & .ec-body ol[type='a'] { list-style-type: lower-alpha; }
  & .ec-body ol[type='A'] { list-style-type: upper-alpha; }
  & .ec-body ol[type='i'] { list-style-type: lower-roman; }
  & .ec-body ol[type='I'] { list-style-type: upper-roman; }
  & .ec-body li + li { margin-top: 0.5rem; }
  & .ec-body li > * + *, & .ec-body blockquote > * + * { margin-top: 1rem; }
  & .ec-body blockquote { border-left: 0.4rem solid var(--ec-story); padding-left: 1.25rem; font-style: italic; }
  & .ec-body [data-block='pull-quote'] { padding: clamp(1.5rem, 4vw, 3rem); background: var(--ec-story); color: var(--ec-on-story); border-radius: var(--ec-radius); margin-block: 3rem; }
  & .ec-body [data-block='pull-quote'] blockquote { border: 0; padding: 0; font-size: var(--ec-heading); font-weight: 700; font-variation-settings: 'SOFT' 100; line-height: 1.25; }
  & .ec-body [data-block='pull-quote'] figcaption { color: inherit; }
  & .ec-body [data-block='gallery'] { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; align-items: start; }
  & .ec-body [data-block='gallery'] li { margin: 0; }
  & .ec-body [data-layout='carousel'] { grid-template-columns: 1fr; }
  & .ec-body img { display: block; border-radius: 0.75rem; }
  & .ec-body [data-block='checklist'] { list-style: none; padding: 0; }
  & .ec-body [data-block='checklist'] li { position: relative; padding-left: 1.75rem; }
  & .ec-body [data-block='checklist'] li > span[aria-hidden] { position: absolute; left: 0; top: 0; }
  & .ec-body [data-block='checklist'] li > p { margin-top: 0; }
  & .ec-body :is([data-block='callout'], [data-block='editorial'], [data-block='embed']) { padding: clamp(1rem, 3vw, 2rem); border: 1px solid currentColor; border-radius: 0.75rem; }
  & .ec-body [data-block='callout'] { background: var(--ec-story); color: var(--ec-on-story); border-color: var(--ec-on-story); }
  & .ec-body :is([data-block='callout'], [data-block='editorial']) > * + * { margin-top: 1rem; }
  & .ec-body [data-block='editorial'] > :first-child { margin-top: 0; }
  & .ec-body [data-block='embed'] a { display: inline-block; min-height: 44px; padding-block: 0.5rem; }
  & .ec-body code { font-family: var(--ec-mono); font-size: var(--ec-copy); font-weight: 400; overflow-wrap: anywhere; }
  & .ec-body pre { padding: 1.25rem; border: 1px solid currentColor; border-radius: 0.75rem; white-space: pre-wrap; overflow-wrap: anywhere; }
  & .ec-body hr { border: 0; border-top: 0.4rem solid var(--ec-story); margin-block: 3rem; width: 4rem; }
  & .ec-section-header { padding-block: 2rem var(--ec-space); }
  & .ec-section-header h1 { font-size: var(--ec-title); margin-block: 1.5rem; }
  & .ec-chip { display: inline-block; width: 0.65em; height: 0.65em; margin-right: 0.25em; border-radius: 50%; background: var(--ec-story); border: 1px solid var(--ec-ink); }
  & .ec-section-header .ec-dek { max-width: 45ch; }
  & .ec-empty { border: 1px solid currentColor; border-radius: var(--ec-radius); padding: var(--ec-space) clamp(1.5rem, 5vw, 5rem); min-height: 50svh; }
  & .ec-empty h2 { font-size: var(--ec-title); margin-block: 2rem; }
  & .ec-empty > p:last-child { max-width: 40ch; }
  & .ec-section-empty { padding-bottom: var(--ec-space); }
  & .ec-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-top: var(--ec-space); padding-block: 2rem 3rem; border-top: 1px solid currentColor; }
  & .ec-footer p { font-weight: 700; font-style: italic; }
  & .ec-footer a { display: inline-flex; align-items: center; gap: 2rem; min-height: 44px; font: 400 var(--ec-small)/1.8 var(--ec-mono); }
  @media (max-width: 1023px) {
    & .ec-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .ec-card-lead .ec-card-link { grid-template-columns: 1fr; }
    & .ec-card-lead .ec-card-visual { aspect-ratio: 3/2; }
  }
  @media (max-width: 767px) {
    & .ec-grid { grid-template-columns: 1fr; }
    & .ec-masthead { padding-block: 1.25rem 1.5rem; }
    & .ec-masthead nav { margin-top: 1rem; }
    & .ec-page .ec-wordmark { letter-spacing: -0.045em; }
    & .ec-body [data-block='gallery'] { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    & .ec-page *, & .ec-page *::before, & .ec-page *::after { scroll-behavior: auto; animation: none; transition: none; }
  }
  @media (forced-colors: active) {
    & .ec-page :focus-visible { outline-color: Highlight; }
    & .ec-card, & .ec-article-band { border: 1px solid CanvasText; }
    & .ec-masthead nav a[aria-current='page'] { border-width: 3px; }
    & .ec-motif { display: none; }
  }
  @media print {
    & .ec-masthead nav, & .ec-skip, & .ec-footer { display: none; }
    & .ec-page { max-width: none; padding: 0; }
    & .ec-article-band, & .ec-body [data-block='pull-quote'], & .ec-body [data-block='callout'] { background: white; color: black; border: 1px solid black; }
    & .ec-body { max-width: 100%; }
  }
`
