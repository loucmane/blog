import { describe, expect, it } from 'vitest'

import { renderSubscriptionPage } from './pages'

describe('subscription pages', () => {
  it('escapes every value it writes', () => {
    const page = renderSubscriptionPage({
      form: { action: '/subscriptions/confirm?a="b"&c=<d>', button: "It's <b>here</b>" },
      heading: '<script>alert(1)</script>',
      message: 'Fish & "chips"',
    })

    expect(page).toContain('<h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>')
    expect(page).toContain('<p>Fish &amp; &quot;chips&quot;</p>')
    expect(page).toContain('action="/subscriptions/confirm?a=&quot;b&quot;&amp;c=&lt;d&gt;"')
    expect(page).toContain('<button type="submit">It&#39;s &lt;b&gt;here&lt;/b&gt;</button>')
    expect(page).not.toContain('<script>')
  })

  it('is a complete document that stays out of search and sends no referrer', () => {
    const page = renderSubscriptionPage({ heading: 'You are unsubscribed', message: 'Done.' })

    expect(page.startsWith('<!doctype html>\n<html lang="en">')).toBe(true)
    expect(page).toContain('<meta name="robots" content="noindex">')
    expect(page).toContain('<meta name="referrer" content="no-referrer">')
    expect(page).toContain('<title>You are unsubscribed | Magazine Foundation</title>')
    // With nothing to press, it leads back to the front page.
    expect(page).toContain('<a href="/" rel="noreferrer">Go to the front page</a>')
    expect(page).not.toContain('<form')
  })
})
