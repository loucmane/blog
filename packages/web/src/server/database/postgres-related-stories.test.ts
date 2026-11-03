import type { QueryResultRow } from 'pg'
import { describe, expect, it } from 'vitest'

import { PostgresRelatedStories } from './postgres-related-stories'

function fakeClient(rows: readonly Record<string, unknown>[]) {
  const calls: { text: string; values: readonly unknown[] }[] = []
  return {
    calls,
    client: {
      async query<Row extends QueryResultRow>(text: string, values: readonly unknown[]) {
        calls.push({ text, values })
        return { rows: rows as unknown as Row[] }
      },
    },
  }
}

describe('PostgreSQL related-story boundary', () => {
  it('decides visibility and leaves out the current article in the query itself', async () => {
    const { calls, client } = fakeClient([])

    await expect(
      new PostgresRelatedStories(client).candidatesFor('article-feature'),
    ).resolves.toEqual([])

    expect(calls).toHaveLength(1)
    expect(calls[0]?.values).toEqual(['article-feature'])
    const text = calls[0]?.text ?? ''
    // What readers may see, decided as content/reader.ts decides it.
    expect(text).toContain('article.deleted_at IS NULL')
    expect(text).toContain('article.published_at IS NOT NULL')
    expect(text).toContain('article.published_revision_id IS NOT NULL')
    expect(text).toContain("article.status = 'published'")
    expect(text).toContain("article.status = 'scheduled'")
    expect(text).toContain('SELECT count(*) = 1')
    expect(text).toContain("job.previous_status = 'published'")
    expect(text).toContain('job.revision_id = article.scheduled_revision_id')
    expect(text).toContain('job.run_at = article.scheduled_at')
    expect(text).toContain("job.status IN ('pending', 'claimed')")
    // The article being read must be visible itself, and is never its own candidate.
    expect(text).toContain('SELECT id FROM public_articles WHERE id = $1')
    expect(text).toContain('FROM public_articles AS candidate')
    expect(text).toContain('WHERE candidate.id <> current_article.id')
    // Sections count apart from categories and tags.
    expect(text).toContain("term.kind = 'section' AS is_section")
    // No title, dek, revision or search text is read, so no draft text leaves the database.
    expect(text).not.toMatch(/\btitle\b|\bdek\b|article_revisions|search_text|document/)
  })

  it('maps every row the query returns, leaving the exclusion to the query', async () => {
    const { client } = fakeClient([
      {
        article_id: 'article-lamp',
        published_at: new Date('2026-06-01T07:00:00.000Z'),
        shared_authors: 0,
        shared_sections: 1,
        shared_terms: 2,
        slug: 'lamp',
      },
      {
        article_id: 'article-window',
        published_at: '2026-06-02T09:30:00.000+02:00',
        shared_authors: 1,
        shared_sections: 0,
        shared_terms: 0,
        slug: 'window',
      },
    ])

    expect(await new PostgresRelatedStories(client).candidatesFor('article-feature')).toEqual([
      {
        articleId: 'article-lamp',
        publishedAt: '2026-06-01T07:00:00.000Z',
        sharedAuthors: 0,
        sharedSections: 1,
        sharedTerms: 2,
        slug: 'lamp',
      },
      {
        articleId: 'article-window',
        publishedAt: '2026-06-02T07:30:00.000Z',
        sharedAuthors: 1,
        sharedSections: 0,
        sharedTerms: 0,
        slug: 'window',
      },
    ])
  })
})
