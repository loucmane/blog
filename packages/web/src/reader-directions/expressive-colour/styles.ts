import { storyColours } from './colours'

/** Only the active reader root emits this CSS; shared pages import no assets. */
export const styles = `
  & { background: var(--ec-paper); color: var(--ec-ink); color-scheme: var(--ec-scheme); }
  ${storyColours.map(({ name }) => `& [data-story-colour='${name}'] { --ec-story: var(--ec-${name}); --ec-on-story: var(--ec-on-${name}); }`).join('\n')}
  /* Optional fonts can retain the contract's single normal local fallback for a full visit. */
  & .ec-page { max-width: var(--ec-page); margin-inline: auto; padding-inline: var(--ec-gutter); min-height: 100vh; font-family: var(--ec-serif); font-size: var(--ec-body); font-weight: 400; font-variation-settings: 'SOFT' 30; font-synthesis: weight style; line-height: 1.5; overflow-wrap: anywhere; text-wrap: pretty; }
  & .ec-page * { box-sizing: border-box; min-width: 0; }
  & .ec-page :where(h1, h2, h3, h4, h5, h6, p, ul, ol, figure, blockquote) { margin: 0; }
  & .ec-page :is(h1, h2, h3, h4, h5, h6) { font-family: var(--ec-serif); }
  & .ec-page :where(h1, h2, h3, h4, h5, h6) { font-weight: 800; font-variation-settings: 'SOFT' 100; letter-spacing: -0.035em; line-height: 1.08; text-wrap: balance; }
  & .ec-page :where(ul, ol:not([type])) { list-style: none; padding: 0; }
  /* Each painted surface resets its companions locally, including nested panels. */
  & .ec-page, & .ec-page :where(.ec-card[data-surface='paper'], [data-block='embed'], [data-variant='related-stories']) { background: var(--ec-paper); color: var(--ec-ink); --ec-text-soft: var(--ec-ink-soft); --ec-code-bg: var(--ec-paper-2); --ec-decoration: var(--ec-story, var(--ec-ink)); }
  & .ec-article { --ec-decoration: var(--ec-story); }
  & .ec-page :where(.ec-article-band, .ec-author-mark, .ec-card[data-surface='filled'], .ec-card-compact .ec-number, [data-block='pull-quote'], [data-variant='tip'], [data-variant='key-points']) { background: var(--ec-story); color: var(--ec-on-story); --ec-text-soft: var(--ec-on-story); --ec-code-bg: transparent; --ec-decoration: currentColor; }
  & .ec-page :where([data-variant='fact-box'], [data-variant='note']) { background: var(--ec-paper-2); color: var(--ec-ink); --ec-text-soft: var(--ec-ink-soft); --ec-code-bg: var(--ec-paper); --ec-decoration: var(--ec-story); }
  & .ec-page :where([data-variant='warning']) { background: var(--ec-ink); color: var(--ec-paper); --ec-text-soft: var(--ec-paper); --ec-code-bg: transparent; --ec-decoration: currentColor; }
  & .ec-page a { color: inherit; text-decoration: none; text-underline-offset: 0.2em; }
  & .ec-page a:hover { text-decoration: underline; }
  & .ec-page :focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }
  & .ec-page ::selection { background: var(--ec-ink); color: var(--ec-paper); }
  & .ec-page .ec-skip { position: absolute; top: 1rem; left: 1rem; z-index: 20; transform: translateY(-200%); padding: 1rem; border-radius: 0.5rem; background: var(--ec-ink); color: var(--ec-paper); font: 400 var(--ec-small)/1.5 var(--ec-mono); }
  & .ec-skip:focus { transform: none; }
  & .ec-page .ec-skip:focus-visible { outline-offset: -5px; }
  & .ec-masthead { padding-block: 2rem var(--ec-space); }
  & .ec-masthead-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 1rem; }
  & .ec-page .ec-wordmark { font-size: var(--ec-wordmark-sm); font-weight: 900; font-variation-settings: 'SOFT' 100; line-height: 1.05; letter-spacing: -0.06em; overflow-wrap: normal; }
  & .ec-page .ec-wordmark-home { font-size: var(--ec-wordmark); }
  & .ec-wordmark a { display: inline-block; padding-block: 0.25rem; min-height: 44px; }
  & .ec-wordmark em { font-weight: 700; white-space: nowrap; }
  & .ec-masthead nav { margin-top: 1.5rem; }
  & :is(.ec-navigation, .ec-topics) ul { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  & .ec-navigation li { max-width: 100%; }
  & .ec-navigation a, & :is(.ec-pill, [data-slot='theme-menu-trigger']) { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0.75rem 1.125rem; border: 1px solid currentColor; border-radius: 2rem; font: 400 var(--ec-label)/1.6 var(--ec-mono); }
  & .ec-navigation a[aria-current] { background: var(--ec-ink); color: var(--ec-paper); font-weight: 500; }
  & [data-slot='theme-menu-trigger'] { background: var(--ec-paper); color: var(--ec-ink); gap: 0.5rem; box-shadow: none; transition: none; }
  & [data-slot='theme-menu-trigger']:is(:hover, :focus-visible) { background: var(--ec-ink); color: var(--ec-paper); outline-offset: -5px; }
  /* Filled pills keep their ring inside the contrasting fill, not white on paper. */
  & .ec-navigation a[aria-current]:focus-visible { outline-offset: -5px; }
  & :is(.ec-label, .ec-card-meta, .ec-card-bottom, .ec-article-meta, .ec-credits) { font: 400 var(--ec-label)/1.8 var(--ec-mono); }
  & .ec-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--ec-gap); align-items: stretch; }
  & .ec-card { grid-column: span 4; border-radius: var(--ec-radius); }
  & .ec-card[data-surface='paper'] { border: 0.375rem solid var(--ec-story); --ec-motif-accent: var(--ec-story); }
  & .ec-card-link { display: flex; flex-direction: column; height: 100%; min-height: 44px; padding: var(--ec-card-padding); gap: 1.5rem; border-radius: inherit; }
  & .ec-page .ec-card-link:hover { text-decoration: none; }
  & .ec-card-link:is(:hover, :focus-visible) :is(h2, h3) { text-decoration: underline; text-decoration-thickness: 2px; }
  & .ec-card-link:focus-visible { outline-offset: -7px; }
  & .ec-card-copy { display: flex; flex-direction: column; gap: 1.25rem; flex: 1; }
  & .ec-card-meta { display: flex; flex-wrap: wrap; gap: 0.5rem 0.75rem; align-items: center; }
  & .ec-number { display: inline-flex; justify-content: center; align-items: center; width: 2.75rem; height: 2.75rem; flex-shrink: 0; border: 1px solid currentColor; border-radius: 50%; font: 500 var(--ec-label)/1.8 var(--ec-mono); }
  & .ec-card-meta > :last-child { margin-left: auto; }
  & .ec-card :is(h2, h3) { font-size: var(--ec-card); }
  & .ec-card .ec-card-title-long { font-size: var(--ec-row); }
  & .ec-card-dek { font-size: var(--ec-copy); line-height: 1.5; }
  & .ec-card-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; align-items: center; margin-top: auto; padding-top: 0.5rem; }
  & .ec-read { display: inline-flex; gap: 1rem; align-items: center; min-height: 44px; font-weight: 500; }
  & .ec-read > span { font: 400 1.5rem/1 var(--ec-serif); }
  & .ec-card-visual { position: relative; aspect-ratio: 4/3; width: 100%; overflow: hidden; border-radius: 0.75rem; align-self: center; }
  & .ec-card-visual picture, & .ec-card-visual > div { object-position: inherit; }
  & .ec-card-visual > div { height: 100%; }
  & .ec-card-visual img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: inherit; border-radius: inherit; }
  & .ec-card-visual img, & .ec-card-visual .ec-motif { transition: transform 200ms ease-out; }
  & .ec-card-link:is(:hover, :focus-visible) img { transform: scale(1.03); }
  & .ec-card-link:is(:hover, :focus-visible) .ec-motif { transform: rotate(6deg); }
  & .ec-motif { display: block; width: 100%; height: 100%; border: 1px solid currentColor; border-radius: inherit; }
  & .ec-card-secondary { grid-column: span 6; }
  & .ec-card-secondary :is(h2, h3) { font-size: var(--ec-card-lg); }
  & .ec-card-secondary .ec-card-title-long { font-size: var(--ec-card); }
  & .ec-card-secondary .ec-card-visual { aspect-ratio: 3/2; }
  & :is(.ec-card-lead, .ec-card-secondary-solo) { grid-column: 1/-1; }
  & :is(.ec-card-lead, .ec-card-secondary-solo) .ec-card-link { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: var(--ec-lead-gap); padding: var(--ec-lead-padding); }
  & :is(.ec-card-lead, .ec-card-secondary-solo) .ec-card-visual { aspect-ratio: 4/3; }
  & .ec-visual-stacked { display: none; }
  & .ec-card-lead :is(h2, h3) { font-size: var(--ec-lead); }
  & .ec-card-lead .ec-card-title-long { font-size: var(--ec-card-lg); }
  & .ec-card-lead .ec-card-dek { font-size: var(--ec-dek); font-style: italic; }
  & .ec-card-lead .ec-card-copy { gap: 1.5rem; }
  & .ec-card-compact { grid-column: 1/-1; background: var(--ec-paper); color: var(--ec-ink); border-bottom: 1px solid currentColor; border-radius: 0; }
  & .ec-card-compact .ec-card-link { display: grid; grid-template-columns: 2.75rem minmax(0, 1fr) auto; align-items: center; gap: 1rem 1.5rem; padding: 1rem 0; }
  & .ec-card-compact .ec-number { background: var(--ec-story); color: var(--ec-on-story); border: 0; border-radius: 0.75rem; }
  & .ec-card-compact :is(h2, h3) { font-size: var(--ec-row); }
  & .ec-card-compact .ec-card-meta { max-width: 30rem; color: var(--ec-ink-soft); }
  & .ec-card-compact .ec-card-meta > :last-child { margin-left: 0; }
  & .ec-card-compact .ec-card-link:focus-visible { outline-offset: 2px; }
  & .ec-article-band { border-radius: var(--ec-radius); padding: var(--ec-band-padding); }
  & .ec-cover-layout { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 3rem; align-items: center; }
  & :is(.ec-cover-motif, .ec-empty-motif) { aspect-ratio: 4/3; }
  & .ec-article-meta { display: flex; flex-wrap: wrap; gap: 1rem 2rem; align-items: center; margin-bottom: 2rem; }
  & :is(.ec-article-band, .ec-section-header) h1 { font-size: var(--ec-title); max-width: 14em; }
  & :is(.ec-article-band, .ec-section-header) h1.ec-title-long { font-size: var(--ec-title-long); }
  & .ec-dek { font-size: var(--ec-dek); font-style: italic; line-height: 1.45; max-width: 34em; }
  & .ec-article-copy .ec-dek, & .ec-credits { margin-top: 1.5rem; }
  & .ec-credits a, & .ec-page figcaption a, & .ec-body [data-block='embed'] a { display: inline-block; min-width: 44px; min-height: 44px; padding-block: 0.5rem; }
  & .ec-credits a, & .ec-page figcaption a { text-decoration: underline; }
  & .ec-hero { margin-block: 2rem var(--ec-space); }
  & .ec-hero :where(figure, picture) { object-position: inherit; }
  & .ec-hero img { display: block; width: 100%; height: auto; max-height: 80svh; object-fit: cover; object-position: inherit; border-radius: var(--ec-radius); }
  & .ec-hero img.absolute { height: 100%; }
  & .ec-hero-cover { margin: 0; }
  & .ec-hero-cover img { max-height: min(80svh, 46rem); }
  & .ec-page figcaption { font: italic 400 1rem/1.5 var(--ec-serif); color: var(--ec-text-soft); margin-top: 0.875rem; }
  & .ec-page figcaption > span, & .ec-body [data-block='pull-quote'] figcaption { font: 400 var(--ec-label)/1.8 var(--ec-mono); }
  & .ec-page figcaption > span { display: block; text-transform: uppercase; }
  & .ec-body { margin-top: var(--ec-space); font-size: var(--ec-body); line-height: var(--ec-leading); display: grid; grid-template-columns: [full-start] minmax(0, 1fr) [wide-start] minmax(0, calc((var(--ec-wide) - var(--ec-feature)) / 2)) [feature-start] minmax(0, calc((var(--ec-feature) - var(--ec-measure)) / 2)) [measure-start] min(var(--ec-measure), 100%) [measure-end] minmax(0, calc((var(--ec-feature) - var(--ec-measure)) / 2)) [feature-end] minmax(0, calc((var(--ec-wide) - var(--ec-feature)) / 2)) [wide-end] minmax(0, 1fr) [full-end]; }
  & .ec-body > * { grid-column: measure; }
  & .ec-body > * + * { margin-top: 1.5rem; }
  & .ec-body :is(h2, h3, h4, h5, h6) { margin-block: 3rem 1rem; }
  & .ec-body h2 { font-size: var(--ec-heading); }
  & .ec-body h2::before { content: '' / ''; display: inline-block; width: 0.4em; height: 0.4em; border-radius: 50%; background: var(--ec-decoration); margin-right: 0.3em; }
  & .ec-body h3 { font-size: var(--ec-h3); }
  & .ec-body h4 { font-size: 1.25rem; }
  & .ec-body h5 { font-size: 1.125rem; font-style: italic; }
  & .ec-body h6 { font: 500 0.875rem/1.5 var(--ec-mono); text-transform: uppercase; letter-spacing: 0; }
  & .ec-body strong { font-weight: 700; }
  & .ec-body a { text-decoration: underline; text-decoration-thickness: 1px; }
  & .ec-body a:hover { text-decoration-thickness: 2px; }
  & .ec-body u { text-decoration: underline wavy 1px; }
  & .ec-body :is(ul, ol) { padding-left: 1.5rem; }
  & .ec-body ul { list-style-type: disc; }
  & .ec-body ol:not([type]) { list-style-type: decimal; }
  & .ec-body li::marker { color: currentColor; }
  & .ec-body ol > li::marker { font-family: var(--ec-mono); font-weight: 500; }
  & .ec-body li + li { margin-top: 0.5rem; }
  & .ec-body :where(li, blockquote) > :where(* + *) { margin-top: 1rem; }
  & .ec-body blockquote { border-left: 0.4rem solid var(--ec-decoration); padding-left: 1.25rem; font-style: italic; }
  & .ec-body [data-block='pull-quote'] { padding: clamp(1.5rem, 4vw, 3rem); border-radius: var(--ec-radius); margin-block: 3rem; }
  & .ec-body [data-block='pull-quote']::before { content: '“' / ''; display: block; font: 900 5rem/0.75 var(--ec-serif); }
  & .ec-body [data-block='pull-quote'] blockquote { border: 0; padding: 0; font-size: var(--ec-heading); font-weight: 700; font-variation-settings: 'SOFT' 100; line-height: 1.25; }
  & .ec-body [data-block='pull-quote'] figcaption::before { content: '— ' / ''; }
  & .ec-body > [data-block='pull-quote'] { grid-column: feature; }
  & .ec-body > [data-block='gallery']:not([data-layout='carousel']) { grid-column: wide; }
  & .ec-body [data-block='gallery'] { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; align-items: start; }
  & .ec-body [data-block='gallery'] li { margin: 0; }
  & .ec-body [data-layout='grid'] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  & .ec-body [data-layout='carousel'] { grid-template-columns: 1fr; }
  & .ec-body img { display: block; border-radius: 0.75rem; }
  & .ec-body [data-block='checklist'] { list-style: none; padding: 0; }
  & .ec-body [data-block='checklist'] > li { position: relative; padding-left: 1.75rem; }
  & .ec-body [data-block='checklist'] > li > span[aria-hidden] { position: absolute; left: 0; top: 0; color: currentColor; }
  & .ec-body [data-block='checklist'] > li > p:first-of-type { margin-top: 0; }
  & .ec-body :is([data-block='callout'], [data-block='editorial'], [data-block='embed']) { padding: clamp(1rem, 3vw, 2rem); border-radius: 0.75rem; }
  & .ec-body :is([data-variant='note'], [data-block='embed']) { border: 2px solid currentColor; }
  & .ec-body [data-variant='key-points'] { border-radius: var(--ec-radius); }
  & .ec-body [data-variant='related-stories'] { border: 0.375rem solid var(--ec-story); }
  & .ec-body [data-variant='methodology'] { border-top: 1px solid currentColor; border-radius: 0; font-size: var(--ec-copy); color: var(--ec-text-soft); }
  & .ec-body :where([data-block='callout'], [data-block='editorial']) > :where(* + *) { margin-top: 1rem; }
  & .ec-body [data-block='editorial']::before, & .ec-body [data-block='callout'] > p:first-child strong { display: block; font: 500 var(--ec-label)/1.8 var(--ec-mono); text-transform: uppercase; }
  & .ec-body [data-block='editorial']::before { margin-bottom: 1rem; }
  & .ec-body [data-variant='fact-box']::before { content: 'Fact box' / ''; }
  & .ec-body [data-variant='key-points']::before { content: 'Key points' / ''; }
  & .ec-body [data-variant='methodology']::before { content: 'Methodology' / ''; }
  & .ec-body [data-variant='related-stories']::before { content: 'Related stories' / ''; }
  & .ec-body [data-variant='warning'] > p:first-child strong::before { content: '! ' / ''; }
  & .ec-body [data-block='embed'] a { font-size: var(--ec-copy); font-weight: 700; }
  & .ec-body [data-block='embed'] a::before { content: '▶ ' / ''; }
  & .ec-body code { font-family: var(--ec-mono); font-size: 0.85em; font-weight: 400; overflow-wrap: anywhere; background: var(--ec-code-bg); color: inherit; padding: 0.1em 0.25em; border-radius: 0.25rem; box-shadow: inset 0 0 0 1px currentColor; }
  & .ec-body pre { background: var(--ec-code-bg); color: inherit; padding: 1.25rem; border: 1px solid currentColor; border-radius: 0.75rem; font: 400 0.875rem/1.7 var(--ec-mono); white-space: pre-wrap; overflow-wrap: anywhere; }
  & .ec-body pre code { background: transparent; padding: 0; border-radius: 0; box-shadow: none; font: inherit; }
  & .ec-body hr { border: 0; background: var(--ec-decoration); height: 0.4rem; width: 4rem; border-radius: 1rem; margin: 3rem auto; }
  & .ec-body :is(h2, h3, h4, h5, h6, hr) + * { margin-top: 0; }
  & .ec-article-end { max-width: var(--ec-measure); margin: 1.5rem auto var(--ec-space); }
  & .ec-end-mark { display: block; width: 0.75rem; height: 0.75rem; border-radius: 50%; background: var(--ec-story); }
  & .ec-topics { margin-top: 3rem; }
  & .ec-topics ul { margin-top: 1rem; }
  & .ec-related h2 { font-size: var(--ec-heading); margin-bottom: 2rem; }
  & .ec-section-header { padding-bottom: var(--ec-space); }
  & .ec-section-header h1 { margin-block: 1.5rem; }
  & .ec-chip { display: inline-block; width: 0.65em; height: 0.65em; margin-right: 0.25em; border-radius: 50%; background: var(--ec-story); border: 1px solid var(--ec-ink); }
  & .ec-chip-ring { background: transparent; border: 0.18em solid var(--ec-story); }
  & .ec-page-heading { display: flex; align-items: center; gap: 1.5rem; }
  & .ec-author-mark { flex: 0 0 6rem; width: 6rem; height: 6rem; border-radius: var(--ec-radius); }
  & .ec-spine-strip { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 1.5rem; }
  & .ec-spine-strip > span { width: 0.5rem; height: 2.5rem; background: var(--ec-story); border-radius: 0.25rem; }
  & .ec-empty { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); align-items: center; gap: 2rem; border: 1px solid currentColor; border-radius: var(--ec-radius); padding: var(--ec-space) var(--ec-band-padding); min-height: 50svh; }
  & .ec-empty h2 { font-size: var(--ec-title); margin-block: 2rem; }
  & .ec-empty p:last-child { max-width: 40ch; }
  & .ec-failure { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 3rem; align-items: center; padding: var(--ec-band-padding); border: 3px solid currentColor; border-radius: var(--ec-radius); background: var(--ec-paper); color: var(--ec-ink); }
  & .ec-failure :is(h1, h2) { font-size: var(--ec-title); margin-block: 1.5rem; }
  & .ec-failure-copy > p:last-of-type { max-width: 34em; }
  & .ec-failure-actions { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 2rem; }
  & .ec-failure-actions button { background: var(--ec-paper); color: var(--ec-ink); cursor: pointer; }
  & .ec-failure-motif { aspect-ratio: 4/3; }
  & .ec-failure-stacked { display: none; }
  & .ec-footer { margin-top: var(--ec-space); padding-bottom: 3rem; }
  & .ec-footer-stripe { display: flex; height: 0.5rem; border-radius: 1rem; overflow: hidden; }
  & .ec-footer-stripe > span { flex: 1; background: var(--ec-story); }
  & .ec-footer-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.5rem; padding-top: 2rem; }
  @media (max-width: 1023px) {
    & .ec-failure { grid-template-columns: 1fr; gap: 1rem; }
    & .ec-failure-stacked { display: block; width: min(100%, 8rem); }
    & .ec-failure-split { display: none; }
    & .ec-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    & .ec-card { grid-column: span 3; }
    & :is(.ec-card-lead, .ec-card-secondary-solo, .ec-card-compact) { grid-column: 1/-1; }
    & :is(.ec-card-lead, .ec-card-secondary-solo) .ec-card-link { grid-template-columns: 1fr; }
    & :is(.ec-card-lead, .ec-card-secondary-solo) .ec-card-visual { aspect-ratio: 3/2; }
    & .ec-visual-stacked { display: block; }
    & .ec-visual-split { display: none; }
    & .ec-cover-layout { display: block; background: transparent; padding: 0; }
    & .ec-cover-layout .ec-article-copy { background: var(--ec-story); color: var(--ec-on-story); padding: var(--ec-band-padding); border-radius: var(--ec-radius); }
    & .ec-cover-motif { display: none; }
    & .ec-hero-cover { max-width: 36rem; margin: 2rem auto 0; background: var(--ec-paper); color: var(--ec-ink); --ec-text-soft: var(--ec-ink-soft); --ec-code-bg: var(--ec-paper-2); }
    & .ec-hero-cover img { max-height: 80svh; }
    & .ec-body > [data-block='pull-quote'], & .ec-body > [data-block='gallery']:not([data-layout='carousel']) { grid-column: measure; }
    & .ec-body [data-layout='grid'] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 767px) {
    & .ec-grid { grid-template-columns: 1fr; }
    & .ec-card { grid-column: 1/-1; }
    & .ec-masthead { padding-block: 1.25rem var(--ec-space); }
    & .ec-masthead nav { margin-top: 1rem; }
    & .ec-page .ec-wordmark { letter-spacing: -0.045em; }
    & .ec-body [data-block='gallery'] { grid-template-columns: 1fr; }
    & .ec-card-compact .ec-card-link { grid-template-columns: 2.75rem minmax(0, 1fr); gap: 0.75rem 1rem; }
    & .ec-card-compact .ec-number { grid-row: span 2; align-self: start; }
    & .ec-card-compact .ec-card-meta { grid-column: 2; }
    & .ec-footer-row { flex-direction: column; align-items: start; }
    & .ec-empty { grid-template-columns: 1fr; }
    & .ec-empty-motif { width: min(100%, 12rem); }
    & .ec-page-heading { flex-direction: column; align-items: start; gap: 0; }
    & .ec-author-mark { margin-top: 1.5rem; }
  }
  @media (max-width: 360px) {
    & [data-slot='theme-menu-trigger'] { width: 44px; padding: 0.5rem; }
    & [data-slot='theme-menu-trigger'] > span { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    & .ec-page *, & .ec-page *::before, & .ec-page *::after { scroll-behavior: auto; animation: none; transition: none; }
    & .ec-card-link:is(:hover, :focus-visible) :is(img, .ec-motif) { transform: none; }
  }
  @media (forced-colors: active) {
    & .ec-page :focus-visible { outline-color: Highlight; }
    & .ec-card, & .ec-card[data-surface='paper'], & .ec-article-band, & .ec-body :is([data-block='callout'], [data-block='editorial'], [data-block='embed']) { border: 1px solid CanvasText; }
    & .ec-navigation a[aria-current] { border-width: 3px; }
    & :is(.ec-motif, .ec-author-mark, .ec-spine-strip, .ec-footer-stripe) { display: none; }
    & .ec-failure { border-color: CanvasText; }
    & .ec-failure-motif { display: none; }
  }
  @media print {
    & { --ec-paper: white; --ec-paper-2: white; --ec-ink: black; --ec-ink-soft: black; background: white; color: black; color-scheme: light; }
    & :is(.ec-masthead nav, .ec-skip, .ec-footer, [data-slot='theme-menu-trigger'], .ec-spine-strip, .ec-author-mark, .ec-related, .ec-cover-motif) { display: none; }
    & .ec-page { --ec-paper: white; --ec-paper-2: white; --ec-ink: black; --ec-ink-soft: black; max-width: none; padding: 0; background: white; color: black; }
    & .ec-page :is(.ec-card, .ec-card-compact .ec-number, .ec-article-band, .ec-article-copy, .ec-hero, [data-block='pull-quote'], [data-block='callout'], [data-block='editorial'], [data-block='embed']) { --ec-text-soft: black; --ec-code-bg: white; --ec-decoration: black; background: white; color: black; border: 1px solid black; }
    & .ec-body { display: block; max-width: 100%; }
    & .ec-cover-layout { display: block; }
    & .ec-failure { display: block; background: white; color: black; border-color: black; }
    & .ec-failure-motif { display: none; }
  }
`
  // Compact this controlled literal at emission; retain readable source and calc spacing.
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s*([{};])\s*/g, '$1')
  .replace(/:\s+/g, ':')
  .replace(/,\s+/g, ',')
  .replace(/;}/g, '}')
  .trim()
