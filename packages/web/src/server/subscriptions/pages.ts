import { siteName } from '@/reader/components/failure-view'

/** A plain page answering a confirmation or unsubscribe link. */
export interface SubscriptionPage {
  /** One button that posts the link's token back, for a page that waits for the reader's word. */
  readonly form?: { readonly action: string; readonly button: string }
  readonly heading: string
  readonly message: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * A small static document in the words and style of the reader's other plain pages; the designed
 * versions belong to the subscription surfaces (blog-0045.15). Its address can carry a token, so it
 * loads nothing and sends no referrer.
 */
export function renderSubscriptionPage(page: SubscriptionPage): string {
  const form = page.form
    ? `<form method="post" action="${escapeHtml(page.form.action)}">
<button type="submit">${escapeHtml(page.form.button)}</button>
</form>
`
    : `<p><a href="/" rel="noreferrer">Go to the front page</a></p>
`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(page.heading)} | ${escapeHtml(siteName)}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;line-height:1.5}main{max-width:36rem;margin:0 auto;padding:4rem 1.5rem}button{font:inherit;padding:.5rem 1rem}</style>
</head>
<body>
<main>
<h1>${escapeHtml(page.heading)}</h1>
<p>${escapeHtml(page.message)}</p>
${form}</main>
</body>
</html>
`
}
