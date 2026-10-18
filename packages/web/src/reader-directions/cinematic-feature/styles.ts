/** Minimum overlay opacity wherever cover text can appear, checked against image extremes. */
export const coverTextScrimOpacity = 0.75

/** Only the active direction root emits these scoped styles. */
export const styles = `
  & { background: var(--cf-ground); color: var(--cf-ink); }
  & .cf-page { font-family: var(--cf-sans); font-size: var(--cf-body); font-weight: 400; font-stretch: 100%; line-height: 1.5; overflow-wrap: anywhere; min-height: 100vh; }
  & .cf-page * { box-sizing: border-box; min-width: 0; }
  & .cf-page :where(h1, h2, h3, h4, h5, h6, p, ul, ol, figure, blockquote) { margin: 0; }
  & .cf-page :is(h1, h2, h3, h4, h5, h6) { font-family: var(--cf-sans); font-weight: 800; font-stretch: 75%; letter-spacing: -0.015em; text-wrap: pretty; }
  & .cf-page :is(ul, ol) { padding: 0; list-style: none; }
  & .cf-page a { color: inherit; text-decoration: none; text-underline-offset: 0.2em; text-decoration-thickness: 1px; }
  & .cf-page a:hover { text-decoration-line: underline; }
  & .cf-page :focus-visible { outline: 2px solid currentColor; outline-offset: 5px; }
  & .cf-page img { border-radius: 0; }
  & .cf-page ::selection { color: var(--cf-ground); background: var(--cf-amber); }
  & .cf-skip { position: absolute; z-index: 10; top: 1rem; left: var(--cf-gutter); transform: translateY(-200%); padding: 1rem; background: var(--cf-ground); color: var(--cf-ink); font: 400 var(--cf-small)/1.5 var(--cf-mono); }
  & .cf-skip:focus { transform: none; }
  & .cf-masthead { position: relative; z-index: 2; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 3rem; padding: 1.25rem var(--cf-gutter); border-bottom: 1px solid var(--cf-slate); background: var(--cf-ground); }
  & .cf-page .cf-wordmark { font-family: var(--cf-sans); font-size: var(--cf-wordmark); font-weight: 800; font-stretch: 100%; letter-spacing: -0.04em; line-height: 1; }
  & .cf-wordmark a { display: inline-flex; align-items: center; min-height: 44px; }
  & .cf-masthead ul { display: flex; flex-wrap: wrap; gap: 0 1.75rem; }
  & .cf-masthead nav a { display: flex; align-items: center; min-height: 44px; min-width: 44px; padding-block: 0.5rem; font: 400 var(--cf-small)/1.5 var(--cf-mono); }
  & .cf-masthead a[aria-current] { text-decoration: underline; text-underline-offset: 0.5em; text-decoration-color: var(--cf-amber); }
  & .cf-page .cf-label, & .cf-story-meta, & .cf-number { font-family: var(--cf-mono); font-size: var(--cf-label); font-stretch: 100%; font-weight: 500; line-height: 1.8; letter-spacing: 0.03em; text-transform: uppercase; color: var(--cf-amber); }
  & .cf-story-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem 1.25rem; }
  & .cf-story-meta a { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; }
  & .cf-story-meta > span { color: var(--cf-secondary); font-weight: 400; }
  & .cf-page .cf-title { font-size: var(--cf-title); font-weight: 850; font-stretch: 68%; text-transform: uppercase; line-height: 0.97; letter-spacing: -0.015em; }
  & .cf-dek { max-width: 48ch; font-size: var(--cf-dek); font-weight: 400; line-height: 1.55; color: var(--cf-secondary); margin-top: 1.5rem; }
  & .cf-cover { position: relative; isolation: isolate; min-height: 85svh; display: grid; align-items: end; }
  & .cf-cover-image { position: absolute; z-index: -2; inset: 0; }
  & .cf-cover-image img { width: 100%; height: 100%; object-fit: cover; object-position: inherit; }
  & .cf-cover-image > div { height: 100%; }
  & .cf-cover-image picture, & .cf-cover-image > div, & .cf-card-image picture, & .cf-card-image > div { object-position: inherit; }
  & .cf-cover::before { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgb(11 12 12 / 24%), rgb(11 12 12 / 4%) 65%, transparent); }
  & .cf-cover-content { --cf-cover-top: 10rem; position: relative; display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); align-items: end; gap: clamp(2rem, 5vw, 5rem); padding: var(--cf-cover-top) var(--cf-gutter) 3rem; width: 100%; max-width: 104rem; margin-inline: auto; }
  & .cf-cover-content::before { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, transparent, rgb(11 12 12 / ${coverTextScrimOpacity}) var(--cf-cover-top), rgb(11 12 12 / ${coverTextScrimOpacity}) calc(100% - 3rem), var(--cf-ground)); }
  & .cf-page .cf-title a { display: block; text-decoration: none; }
  & .cf-page .cf-title a:is(:hover, :focus-visible) { text-decoration-line: underline; text-decoration-thickness: 1px; text-underline-offset: 0.08em; }
  & .cf-read { display: inline-flex; align-items: center; gap: 2rem; min-height: 44px; margin-top: 1.5rem; padding-block: 0.75rem; border-bottom: 1px solid var(--cf-amber); font: 400 var(--cf-small)/1.5 var(--cf-mono); }
  & .cf-read span { color: var(--cf-amber); }
  & .cf-next { border-top: 1px solid var(--cf-slate); }
  & .cf-next > li { display: grid; grid-template-columns: 1.75rem minmax(0, 1fr) auto; gap: 0.75rem; padding-block: 1.25rem; border-bottom: 1px solid var(--cf-slate); align-items: start; }
  & .cf-next h2 { font-size: 1.375rem; line-height: 1.2; font-stretch: 85%; }
  & .cf-next h2 a { display: block; min-height: 44px; }
  & .cf-next .cf-story-meta { gap: 0 0.75rem; margin-top: 0.25rem; font-size: 0.625rem; }
  & .cf-thumbnail { width: 80px; aspect-ratio: 1; position: relative; }
  & .cf-thumbnail img { position: absolute; inset: 0; height: 100%; width: 100%; object-fit: cover; }
  & .cf-thumbnail > div { height: 100%; }
  & .cf-number { font-variant-numeric: tabular-nums; }
  & .cf-grid, & .cf-section-header, & .cf-section-empty, & .cf-empty, & .cf-footer { width: min(100% - var(--cf-gutter) * 2, var(--cf-page)); margin-inline: auto; }
  & .cf-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--cf-space) 2.5rem; }
  & .cf-further { padding-top: var(--cf-space); }
  & .cf-card-image { position: relative; aspect-ratio: 3 / 2; margin-bottom: 1rem; }
  & .cf-card-image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: inherit; }
  & .cf-card-image > div { height: 100%; }
  & .cf-card-title { font-size: var(--cf-card); text-transform: uppercase; line-height: 1.05; }
  & .cf-card-title a { display: block; min-height: 44px; }
  & .cf-card-dek { margin-top: 1rem; font-size: var(--cf-copy); line-height: 1.6; color: var(--cf-secondary); max-width: 55ch; }
  & .cf-card-text { border-top: 1px solid var(--cf-amber); padding-top: 2rem; }
  & .cf-card-text .cf-card-title { margin-top: 1rem; }
  & .cf-hero-text { border-bottom: 1px solid var(--cf-slate); }
  & .cf-hero-text::before { background: none; }
  & .cf-article-hero { position: relative; isolation: isolate; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(75svh, auto) auto; }
  & .cf-hero, & .cf-hero figure { display: contents; object-position: inherit; }
  & .cf-hero picture, & .cf-hero figure > div { display: block; position: relative; grid-row: 1; grid-column: 1; object-position: inherit; height: 100%; }
  & .cf-hero img { position: absolute; inset: 0; height: 100%; width: 100%; object-fit: cover; object-position: inherit; }
  /* Reach the contrast floor before any heading text: mobile padding is 14rem, desktop at least 15rem. */
  & .cf-hero figure::after { content: ''; grid-row: 1; grid-column: 1; z-index: 1; pointer-events: none; background: linear-gradient(180deg, rgb(11 12 12 / 35%), rgb(11 12 12 / 75%) 14rem, var(--cf-ground)); }
  & .cf-hero figcaption { grid-row: 2; padding: 1.5rem var(--cf-gutter); border-bottom: 1px solid var(--cf-slate); }
  & .cf-article-heading { grid-row: 1; grid-column: 1; align-self: end; position: relative; z-index: 2; width: min(100%, 80rem); padding: clamp(15rem, 36vh, 26rem) var(--cf-gutter) 3rem; }
  & .cf-article-hero.cf-hero-text .cf-article-heading { padding-top: var(--cf-space); }
  & .cf-article-hero.cf-hero-text { min-height: 60svh; grid-template-rows: auto; }
  & .cf-credits { display: flex; flex-wrap: wrap; gap: 0.75rem 2rem; margin-top: 2rem; font: 400 var(--cf-small)/1.8 var(--cf-mono); color: var(--cf-secondary); }
  & .cf-page figcaption { font: 400 var(--cf-small)/1.8 var(--cf-mono); color: var(--cf-secondary); }
  & .cf-page figcaption a { display: inline-block; min-height: 44px; padding-block: 0.625rem; text-decoration: underline; }
  & .cf-reading-surface { background: var(--cf-paper); color: var(--cf-body-ink); padding: var(--cf-space) var(--cf-gutter); container-type: inline-size; }
  & .cf-body { max-width: var(--cf-measure); margin-inline: auto; font-size: var(--cf-body); font-stretch: 100%; line-height: var(--cf-leading); display: flow-root; }
  & .cf-body > * + * { margin-top: 1.5rem; }
  & .cf-body :is(h2, h3, h4, h5, h6) { line-height: 1.15; margin-block: 3rem 1rem; font-stretch: 85%; }
  & .cf-body h2 { font-size: var(--cf-heading); }
  & .cf-body h3 { font-size: var(--cf-dek); }
  & .cf-body :is(h4, h5, h6) { font-size: var(--cf-body); }
  & .cf-body strong { font-weight: 700; }
  & .cf-body a { text-decoration: underline; }
  & .cf-body figcaption { margin-top: 1rem; color: var(--cf-body-secondary); }
  & .cf-body :is(ul, ol) { padding-left: 1.5rem; }
  & .cf-body ul { list-style-type: disc; }
  & .cf-body ol { list-style-type: decimal; }
  & .cf-body ol[type='a'] { list-style-type: lower-alpha; }
  & .cf-body ol[type='A'] { list-style-type: upper-alpha; }
  & .cf-body ol[type='i'] { list-style-type: lower-roman; }
  & .cf-body ol[type='I'] { list-style-type: upper-roman; }
  & .cf-body li + li { margin-top: 0.5rem; }
  & .cf-body li > * + *, & .cf-body blockquote > * + * { margin-top: 1rem; }
  & .cf-body blockquote { border-left: 2px solid var(--cf-body-accent); padding-left: 1.5rem; }
  & .cf-body [data-block='pull-quote'] { margin-block: 3rem; border-block: 1px solid var(--cf-body-accent); padding-block: 2rem; }
  & .cf-body [data-block='pull-quote'] blockquote { padding: 0; border: 0; font-size: var(--cf-heading); font-weight: 700; font-stretch: 85%; line-height: 1.2; }
  & .cf-body [data-block='pull-quote'] figcaption { color: var(--cf-body-accent); }
  & .cf-body > figure:has(picture), & .cf-body > [data-block='gallery'] { width: calc(100cqw + var(--cf-gutter) * 2); margin-inline: calc((100% - 100cqw) / 2 - var(--cf-gutter)); margin-block: var(--cf-space); }
  & .cf-body > figure:has(picture) figcaption { padding-inline: var(--cf-gutter); }
  & .cf-body [data-block='gallery'] { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; align-items: start; }
  & .cf-body [data-block='gallery'] li { margin: 0; }
  & .cf-body [data-block='gallery'] figcaption { padding-inline: 1rem; }
  & .cf-body [data-layout='carousel'] { grid-template-columns: 1fr; }
  & .cf-body [data-block='checklist'] { list-style: none; padding: 0; }
  & .cf-body [data-block='checklist'] li { position: relative; padding-left: 1.75rem; }
  & .cf-body [data-block='checklist'] li > span[aria-hidden] { position: absolute; left: 0; top: 0; color: var(--cf-body-accent); }
  & .cf-body [data-block='checklist'] li > p { margin-top: 0; }
  & .cf-body :is([data-block='callout'], [data-block='editorial'], [data-block='embed']) { padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--cf-body-secondary); }
  & .cf-body :is([data-block='callout'], [data-block='editorial']) > * + * { margin-top: 1rem; }
  & .cf-body [data-block='editorial'] > :first-child { margin-top: 0; }
  & .cf-body [data-block='embed'] a { display: inline-block; min-height: 44px; padding-block: 0.5rem; }
  & .cf-body code { font-family: var(--cf-mono); font-size: var(--cf-copy); overflow-wrap: anywhere; }
  & .cf-body pre { padding: 1.25rem; border-block: 1px solid var(--cf-body-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }
  & .cf-body hr { border: 0; border-top: 1px solid var(--cf-body-accent); margin-block: 3rem; }
  & .cf-section-header { padding-block: var(--cf-space); }
  & .cf-section-header .cf-label { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; }
  & .cf-empty { padding-block: var(--cf-space); min-height: 65svh; }
  & .cf-empty h2 { font-size: var(--cf-title); font-stretch: 68%; text-transform: uppercase; line-height: 1; margin-block: 2rem; }
  & .cf-empty > p:last-child, & .cf-section-empty { max-width: 50ch; color: var(--cf-secondary); }
  & .cf-section-empty { padding-block: 2rem; }
  & .cf-footer { padding-block: 2rem 4rem; margin-top: var(--cf-space); border-top: 1px solid var(--cf-slate); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem 2rem; }
  & .cf-footer p { font-weight: 800; }
  & .cf-footer a { display: inline-flex; align-items: center; gap: 2rem; min-height: 44px; font: 400 var(--cf-small)/1.8 var(--cf-mono); }
  @media (min-width: 1024px) {
    & .cf-cover-page { display: grid; grid-template-columns: minmax(0, 1fr); }
    & .cf-cover-page .cf-masthead { grid-row: 1; grid-column: 1; align-self: start; background: rgb(11 12 12 / 85%); }
    & .cf-cover-page main { grid-row: 1; grid-column: 1; }
    & .cf-cover-page .cf-cover { min-height: 100svh; }
    & .cf-cover-page .cf-article-hero.cf-hero-text .cf-article-heading { padding-top: 12rem; }
  }
  @media (max-width: 1023px) {
    & .cf-cover-content { --cf-cover-top: 8rem; grid-template-columns: 1fr; }
    & .cf-next { margin-top: 2rem; }
    & .cf-cover-image { bottom: auto; height: 75svh; }
    & .cf-next h2 { font-size: 1.625rem; }
  }
  @media (max-width: 767px) {
    & .cf-grid { grid-template-columns: 1fr; }
    & .cf-masthead { padding-block: 0.75rem; gap: 0.25rem; }
    & .cf-masthead nav { flex-basis: 100%; }
    & .cf-masthead ul { column-gap: 1.25rem; }
    & .cf-cover-content { --cf-cover-top: 6rem; padding-bottom: 2rem; }
    & .cf-article-hero { grid-template-rows: minmax(65svh, auto) auto; }
    & .cf-article-heading { padding-top: 14rem; }
    & .cf-body [data-block='gallery'] { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: no-preference) {
    & .cf-title { transform: translateY(0); transition: transform 450ms ease-out; }
    @starting-style { & .cf-title { transform: translateY(6px); } }
  }
  @media (prefers-reduced-motion: reduce) {
    & .cf-page *, & .cf-page *::before, & .cf-page *::after { scroll-behavior: auto; animation: none; transition: none; }
  }
  @media (forced-colors: active) {
    & .cf-page :focus-visible { outline-color: Highlight; }
    & .cf-cover::before, & .cf-cover-content::before, & .cf-hero figure::after { background: Canvas; }
  }
  @media print {
    & .cf-masthead nav, & .cf-skip, & .cf-footer { display: none; }
    & .cf-cover-page { display: block; }
    & .cf-article-heading { padding: 2rem; }
    & .cf-body > figure:has(picture), & .cf-body > [data-block='gallery'] { width: 100%; margin-inline: 0; }
  }
`
