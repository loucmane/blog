import type { AuthorProfile, MediaAsset, TaxonomyTerm } from '@/server/content/domain'
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
import { authorPath, sectionPath, storyPath, topicPath } from './paths'
import type {
  ArticleView,
  AuthorLink,
  AuthorView,
  HomeView,
  ReaderNavigation,
  SectionLink,
  SectionView,
  StoryCard,
  TopicLink,
  TopicView,
} from './views'

/** The content store the public reader reads, as selected by the application runtime. */
export interface ReaderSource {
  /** False when media originals cannot be served, so the views leave images out. */
  readonly mediaAvailable: boolean
  readonly repository: ContentRepository
}

/** How many stories follow the lead story on the home page. */
export const homeRecentStoryLimit = 12

/** The most related stories an article lists. */
export const relatedStoryLimit = 4

/**
 * A category or tag as readers see it. A category and a tag may share a slug: readers get one
 * topic for both, named by the category.
 */
interface Topic {
  /** The taxonomy terms behind this topic. */
  readonly ids: ReadonlySet<string>
  readonly name: string
  readonly slug: string
}

interface Taxonomy {
  /** Each article's sections, primary section (lowest link position) first. */
  readonly sectionsByArticle: ReadonlyMap<string, readonly TaxonomyTerm[]>
  readonly sectionsBySlug: ReadonlyMap<string, TaxonomyTerm>
  /** Each article's topics by lowest link position, each topic once. */
  readonly topicsByArticle: ReadonlyMap<string, readonly Topic[]>
  readonly topicsBySlug: ReadonlyMap<string, Topic>
}

function sectionLink(section: TaxonomyTerm): SectionLink {
  return { href: sectionPath(section.slug), name: section.name, slug: section.slug }
}

function topicLink(topic: Topic): TopicLink {
  return { href: topicPath(topic.slug), name: topic.name }
}

function authorLink(author: AuthorProfile): AuthorLink {
  return { href: authorPath(author.slug), name: author.displayName }
}

const topicKinds: readonly TaxonomyTerm['kind'][] = ['category', 'tag']

/** Every category and tag as a topic, keyed by slug. Categories come first, so they name a topic. */
function topicsFrom(terms: readonly TaxonomyTerm[]): ReadonlyMap<string, Topic> {
  const topics = new Map<string, { ids: Set<string>; name: string; slug: string }>()
  const topicTerms = terms
    .filter(({ kind }) => topicKinds.includes(kind))
    .sort(
      (left, right) =>
        topicKinds.indexOf(left.kind) - topicKinds.indexOf(right.kind) ||
        left.id.localeCompare(right.id),
    )
  for (const term of topicTerms) {
    const topic = topics.get(term.slug)
    if (topic) topic.ids.add(term.id)
    else topics.set(term.slug, { ids: new Set([term.id]), name: term.name, slug: term.slug })
  }
  return topics
}

async function loadTaxonomy(transaction: ContentTransaction): Promise<Taxonomy> {
  const [terms, links] = await Promise.all([
    transaction.listTaxonomyTerms(),
    transaction.listArticleTaxonomies(),
  ])
  const termsById = new Map(terms.map((term) => [term.id, term]))
  const topicsBySlug = topicsFrom(terms)
  const topicsById = new Map(
    [...topicsBySlug.values()].flatMap((topic) => [...topic.ids].map((id) => [id, topic] as const)),
  )
  const linkedByArticle = new Map<string, { position: number; term: TaxonomyTerm }[]>()
  for (const link of links) {
    const term = termsById.get(link.taxonomyId)
    if (!term) continue
    linkedByArticle.set(link.articleId, [
      ...(linkedByArticle.get(link.articleId) ?? []),
      { position: link.position, term },
    ])
  }
  const sectionsByArticle = new Map<string, readonly TaxonomyTerm[]>()
  const topicsByArticle = new Map<string, readonly Topic[]>()
  for (const [articleId, linked] of linkedByArticle) {
    const ordered = linked
      .sort(
        (left, right) =>
          left.position - right.position || left.term.slug.localeCompare(right.term.slug),
      )
      .map(({ term }) => term)
    const sections = ordered.filter(({ kind }) => kind === 'section')
    if (sections.length > 0) sectionsByArticle.set(articleId, sections)
    const topics = [...new Set(ordered.flatMap(({ id }) => topicsById.get(id) ?? []))]
    if (topics.length > 0) topicsByArticle.set(articleId, topics)
  }
  return {
    sectionsByArticle,
    sectionsBySlug: new Map(
      terms.filter(({ kind }) => kind === 'section').map((section) => [section.slug, section]),
    ),
    topicsByArticle,
    topicsBySlug,
  }
}

function filedInSection(articleId: string, section: TaxonomyTerm, taxonomy: Taxonomy): boolean {
  return (taxonomy.sectionsByArticle.get(articleId) ?? []).some(({ id }) => id === section.id)
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

/*
 * Related stories, interim rule: the newest other visible stories filed under the article's
 * primary section, at most `relatedStoryLimit`. This function is the seam that blog-0045.7
 * (deterministic related-story selection) replaces; nothing else depends on how it chooses.
 */
function relatedArticles(
  articleId: string,
  visible: readonly VisibleArticle[],
  taxonomy: Taxonomy,
): readonly VisibleArticle[] {
  const section = taxonomy.sectionsByArticle.get(articleId)?.[0]
  if (!section) return []
  return visible
    .filter(
      ({ article }) => article.id !== articleId && filedInSection(article.id, section, taxonomy),
    )
    .slice(0, relatedStoryLimit)
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
    const credited = await transaction.listArticleAuthors(story.article.id)
    const { blocks, body, hero } = storyContent(story, media)
    const section = taxonomy.sectionsByArticle.get(story.article.id)?.[0]
    return {
      ...publishedCopy(story),
      authorLinks: credited.map(authorLink),
      authors: credited.map(({ displayName }) => displayName),
      body,
      hero,
      href: storyPath(story.article.slug),
      navigation: navigationFor(visible, taxonomy),
      publishedAt: story.article.publishedAt ?? story.revision.createdAt,
      readingMinutes: readingMinutes(blocks),
      related: await storyCards(
        transaction,
        relatedArticles(story.article.id, visible, taxonomy),
        taxonomy,
        media,
      ),
      section: section ? sectionLink(section) : null,
      slug: story.article.slug,
      topics: (taxonomy.topicsByArticle.get(story.article.id) ?? []).map(topicLink),
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
    const inSection = visible.filter(({ article }) => filedInSection(article.id, section, taxonomy))
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

/** An author's page, with only the visible stories that credit them. */
export async function readAuthorView(
  source: ReaderSource,
  slug: string,
): Promise<AuthorView | null> {
  return source.repository.transaction(async (transaction) => {
    const author = await transaction.getAuthorBySlug(slug)
    if (!author) return null
    const credited = new Set((await transaction.listAuthorArticles(author.id)).map(({ id }) => id))
    const visible = await listVisibleArticles(transaction)
    const taxonomy = await loadTaxonomy(transaction)
    const media = await loadMedia(transaction, source)
    return {
      bio: author.bio.trim() || null,
      href: authorPath(author.slug),
      name: author.displayName,
      navigation: navigationFor(visible, taxonomy),
      slug: author.slug,
      stories: await storyCards(
        transaction,
        visible.filter(({ article }) => credited.has(article.id)),
        taxonomy,
        media,
      ),
    }
  })
}

/** A topic's page, with only the visible stories filed under one of its categories or tags. */
export async function readTopicView(source: ReaderSource, slug: string): Promise<TopicView | null> {
  return source.repository.transaction(async (transaction) => {
    const taxonomy = await loadTaxonomy(transaction)
    const topic = taxonomy.topicsBySlug.get(slug)
    if (!topic) return null
    const visible = await listVisibleArticles(transaction)
    const onTopic = visible.filter(({ article }) =>
      (taxonomy.topicsByArticle.get(article.id) ?? []).includes(topic),
    )
    const media = await loadMedia(transaction, source)
    return {
      description: null,
      href: topicPath(topic.slug),
      name: topic.name,
      navigation: navigationFor(visible, taxonomy),
      slug: topic.slug,
      stories: await storyCards(transaction, onTopic, taxonomy, media),
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
