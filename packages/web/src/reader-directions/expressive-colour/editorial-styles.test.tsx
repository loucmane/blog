// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, it } from 'vitest'

import { ArticleBody } from '@/reader/components/article-body'
import { readArticleView } from '@/reader/read-model'
import { CURRENT_CONTENT_DOCUMENT_VERSION, parseContentDocument } from '@/server/content/document'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { ContentService } from '@/server/content/service'
import { seedLabContent } from '@/server/lab/seed'

import { blockFixtureDocument } from './block-fixture'
import { styles } from './styles'

afterEach(() => document.body.replaceChildren())

it('keeps heading and divider spacing from adding adjacent grid margins', () => {
  const sheet = document.createElement('style')
  sheet.textContent = styles.replaceAll('&', '.ec-test')
  document.body.innerHTML = `<div class="ec-test"><div class="ec-page"><div class="ec-body">
    <h2>Heading</h2><h3>Following heading</h3><p>Following paragraph</p>
    <hr><p>Following divider</p>
  </div></div></div>`
  document.body.append(sheet)
  const body = document.querySelector('.ec-body')!
  for (const selector of ['h3', 'h3 + p', 'hr + p']) {
    expect(getComputedStyle(body.querySelector(selector)!).marginTop, selector).toBe('0px')
  }
})

it('leaves ordered-list numbering to the shared renderer without per-type CSS overrides', () => {
  expect(styles).not.toMatch(/ol\[type=/)
})

it('publishes the browser document with all five exact list types and nested media', async () => {
  const fixture = parseContentDocument({
    articleId: 'ec-block-fixture',
    title: 'Editorial style fixture',
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    document: blockFixtureDocument,
  })
  const repository = new InMemoryContentRepository()
  await seedLabContent({ repository, objects: new InMemoryOriginalObjectStore() })
  const service = new ContentService(repository)
  const draft = await service.createArticle({
    id: fixture.articleId,
    slug: 'ec-block-fixture',
    title: fixture.title,
    dek: 'A temporary story exercising every editorial surface and list marker.',
    document: fixture,
    idempotencyKey: 'ec-create-fixture',
  })
  await service.publish({
    articleId: draft.article.id,
    revisionId: draft.revision.id,
    expectedVersion: draft.article.version,
    idempotencyKey: 'ec-publish-fixture',
  })
  const view = await readArticleView({ repository, mediaAvailable: true }, draft.article.slug)
  expect(view).not.toBeNull()
  document.body.innerHTML = renderToStaticMarkup(<ArticleBody blocks={view!.body} />)
  const lists = Array.from(document.body.querySelectorAll(':scope > ol'))
  expect(lists.map((list) => list.getAttribute('type'))).toEqual(['1', 'a', 'A', 'i', 'I'])
  for (const list of lists) expect(list).toHaveAttribute('start', '3')
  expect(document.body.querySelectorAll('h2, h3, h4, h5, h6')).toHaveLength(6)
  expect(document.body.querySelectorAll('[data-variant="key-points"]')).toHaveLength(3)
  expect(document.body.querySelectorAll(':scope > [data-block="gallery"]')).toHaveLength(3)
  expect(document.body.querySelectorAll('img')).toHaveLength(11)
  // Seeding generates the sample illustrations with sharp, which can exceed 5s under a full,
  // instrumented suite (the same allowance as the lab seed route tests).
}, 30_000)
