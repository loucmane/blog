import type { ArticleTaxonomy, MediaAsset, TaxonomyTerm } from '@/server/content/domain'
import type { ContentRepository, ContentTransaction } from '@/server/content/ports'
import {
  listPublishedStories,
  listVisibleArticles,
  loadPublishedStory,
  loadVisibleRevision,
  type ReaderStory,
  type VisibleArticle,
} from '@/server/content/reader'

import {
  convertBlocks,
  firstImage,
  readingMinutes,
  referencedMediaIds,
  splitLeadImage,
  type ReaderMediaLookup,
} from './blocks'
import { sectionPath, storyPath } from './paths'
import type {
  ArticleView,
  HomeView,
  ReaderNavigation,
  SectionLink,
  SectionView,
  StoryCard,
} from './views'

/** The content store the public reader reads, as selected by the application runtime. */
export interface ReaderSource {
  /** False when media originals cannot be served, so the views leave images out. */
  readonly mediaAvailable: boolean
  readonly repository: ContentRepository
}

/** How many stories follow the lead story on the home page. */
export const homeRecentStoryLimit = 12

interface Taxonomy {
  /** Each article's sections, primary section (lowest link position) first. */
  readonly sectionsByArticle: ReadonlyMap<string, readonly TaxonomyTerm[]>
  readonly sectionsBySlug: ReadonlyMap<string, TaxonomyTerm>
}

function sectionLink(section: TaxonomyTerm): SectionLink {
  return { href: sectionPath(section.slug), name: section.name, slug: section.slug }
}

async function loadTaxonomy(transaction: ContentTransaction): Promise<Taxonomy> {
  const [terms, links] = await Promise.all([
    transaction.listTaxonomyTerms(),
    transaction.listArticleTaxonomies(),
  ])
  const sections = new Map(
    terms.filter(({ kind }) => kind === 'section').map((term) => [term.id, term]),
  )
  const linksByArticle = new Map<string, ArticleTaxonomy[]>()
  for (const link of links) {
    if (!sections.has(link.taxonomyId)) continue
    linksByArticle.set(link.articleId, [...(linksByArticle.get(link.articleId) ?? []), link])
  }
  const sectionsByArticle = new Map<string, readonly TaxonomyTerm[]>()
  for (const [articleId, articleLinks] of linksByArticle) {
    const ordered = articleLinks
      .flatMap((link) => {
        const section = sections.get(link.taxonomyId)
        return section ? [{ position: link.position, section }] : []
      })
      .sort(
        (left, right) =>
          left.position - right.position || left.section.slug.localeCompare(right.section.slug),
      )
      .map(({ section }) => section)
    sectionsByArticle.set(articleId, ordered)
  }
  return {
    sectionsByArticle,
    sectionsBySlug: new Map([...sections.values()].map((section) => [section.slug, section])),
  }
}

async function loadMedia(
  transaction: ContentTransaction,
  source: ReaderSource,
): Promise<ReaderMediaLookup> {
  if (!source.mediaAvailable) return null
  const assets: readonly MediaAsset[] = await transaction.listMediaAssets()
  return new Map(assets.map((asset) => [asset.id, asset]))
}

function navigationFor(visible: readonly VisibleArticle[], taxonomy: Taxonomy): ReaderNavigation {
  const sections = new Map<string, TaxonomyTerm>()
  for (const { article } of visible) {
    for (const section of taxonomy.sectionsByArticle.get(article.id) ?? []) {
      sections.set(section.id, section)
    }
  }
  return {
    sections: [...sections.values()]
      .sort(
        (left, right) =>
          left.name.localeCompare(right.name, 'en') || left.slug.localeCompare(right.slug, 'en'),
      )
      .map(sectionLink),
  }
}

/** The published revision's own title and summary, never the article's newer draft fields. */
function publishedCopy(story: ReaderStory): { readonly dek: string; readonly title: string } {
  const { article, revision } = story
  const title = revision.title?.trim() || revision.document.title
  const unchangedSincePublication = article.currentDraftRevisionId === revision.id
  const dek = revision.dek ?? (unchangedSincePublication ? article.dek : '')
  return { dek: dek.trim(), title }
}

function storyContent(story: ReaderStory, media: ReaderMediaLookup) {
  const blocks = convertBlocks(story.revision.document.document.content, media)
  return { blocks, ...splitLeadImage(blocks) }
}

function storyCard(story: ReaderStory, taxonomy: Taxonomy, media: ReaderMediaLookup): StoryCard {
  const { blocks, hero } = storyContent(story, media)
  const section = taxonomy.sectionsByArticle.get(story.article.id)?.[0]
  return {
    ...publishedCopy(story),
    href: storyPath(story.article.slug),
    image: hero ?? firstImage(blocks),
    publishedAt: story.article.publishedAt ?? story.revision.createdAt,
    readingMinutes: readingMinutes(blocks),
    section: section ? sectionLink(section) : null,
    slug: story.article.slug,
  }
}

async function storyCards(
  transaction: ContentTransaction,
  visible: readonly VisibleArticle[],
  taxonomy: Taxonomy,
  media: ReaderMediaLookup,
): Promise<StoryCard[]> {
  const cards: StoryCard[] = []
  for (const article of visible) {
    cards.push(storyCard(await loadVisibleRevision(transaction, article), taxonomy, media))
  }
  return cards
}

export async function readHomeView(source: ReaderSource): Promise<HomeView> {
  return source.repository.transaction(async (transaction) => {
    const visible = await listVisibleArticles(transaction)
    const taxonomy = await loadTaxonomy(transaction)
    const media = await loadMedia(transaction, source)
    const [lead, ...recent] = await storyCards(
      transaction,
      visible.slice(0, homeRecentStoryLimit + 1),
      taxonomy,
      media,
    )
    return { lead: lead ?? null, navigation: navigationFor(visible, taxonomy), recent }
  })
}

export async function readArticleView(
  source: ReaderSource,
  slug: string,
): Promise<ArticleView | null> {
  return source.repository.transaction(async (transaction) => {
    const story = await loadPublishedStory(transaction, slug)
    if (!story) return null
    const visible = await listVisibleArticles(transaction)
    const taxonomy = await loadTaxonomy(transaction)
    const media = await loadMedia(transaction, source)
    const { blocks, body, hero } = storyContent(story, media)
    const section = taxonomy.sectionsByArticle.get(story.article.id)?.[0]
    return {
      ...publishedCopy(story),
      authors: [],
      body,
      hero,
      href: storyPath(story.article.slug),
      navigation: navigationFor(visible, taxonomy),
      publishedAt: story.article.publishedAt ?? story.revision.createdAt,
      readingMinutes: readingMinutes(blocks),
      section: section ? sectionLink(section) : null,
      slug: story.article.slug,
    }
  })
}

export async function readSectionView(
  source: ReaderSource,
  slug: string,
): Promise<SectionView | null> {
  return source.repository.transaction(async (transaction) => {
    const taxonomy = await loadTaxonomy(transaction)
    const section = taxonomy.sectionsBySlug.get(slug)
    if (!section) return null
    const visible = await listVisibleArticles(transaction)
    const inSection = visible.filter(({ article }) =>
      (taxonomy.sectionsByArticle.get(article.id) ?? []).some(({ id }) => id === section.id),
    )
    const media = await loadMedia(transaction, source)
    return {
      description: null,
      href: sectionPath(section.slug),
      name: section.name,
      navigation: navigationFor(visible, taxonomy),
      slug: section.slug,
      stories: await storyCards(transaction, inSection, taxonomy, media),
    }
  })
}

/** Media ids referenced by publicly visible revisions: the only media the reader serves. */
export async function readPublicMediaIds(source: ReaderSource): Promise<readonly string[]> {
  return source.repository.transaction(async (transaction) => {
    const ids = new Set<string>()
    for (const story of await listPublishedStories(transaction)) {
      for (const id of referencedMediaIds(story.revision.document.document)) ids.add(id)
    }
    return [...ids].sort()
  })
}
