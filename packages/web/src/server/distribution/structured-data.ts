import { firstImage } from '@/reader/blocks'
import { siteName } from '@/reader/components/failure-view'
import type { ArticleView, AuthorLink, ReaderImage } from '@/reader/views'

import { absolute, canonicalArticleUrl, canonicalSectionUrl } from './canonical'

/*
 * schema.org structured data for a public story (TS-06, AC-05). The story page builds it from the
 * published `ArticleView` it already renders, so every value comes from canonical storage through
 * the read model: the published revision's copy, the byline from the `AuthorProfile` projection,
 * the story's section and topics, and its images. Nothing is parsed out of markup, and every URL
 * comes from canonical.ts. Only a publicly visible story has a view, so a draft, scheduled,
 * previewed, unpublished or deleted story has nothing to emit.
 */

const schemaOrg = 'https://schema.org'

/** The publication itself, as the publisher of every story. */
export interface JsonLdOrganization {
  readonly '@type': 'Organization'
  readonly name: string
  readonly url: string
}

/** A credited author, with their author page. */
export interface JsonLdPerson {
  readonly '@type': 'Person'
  readonly name: string
  readonly url: string
}

export interface JsonLdImage {
  readonly '@type': 'ImageObject'
  readonly height?: number
  readonly url: string
  readonly width?: number
}

export interface JsonLdArticle {
  readonly '@type': 'Article'
  readonly articleSection?: string
  /** The credited authors in byline order; absent, never a placeholder, when nobody is credited. */
  readonly author?: readonly JsonLdPerson[]
  readonly datePublished: string
  readonly description?: string
  readonly headline: string
  readonly image?: JsonLdImage
  readonly keywords?: readonly string[]
  readonly mainEntityOfPage: string
  readonly publisher: JsonLdOrganization
  readonly url: string
}

export interface JsonLdListItem {
  readonly '@type': 'ListItem'
  readonly item: string
  readonly name: string
  readonly position: number
}

export interface JsonLdBreadcrumbList {
  readonly '@type': 'BreadcrumbList'
  readonly itemListElement: readonly JsonLdListItem[]
}

/** One story's `Article` and `BreadcrumbList`, as a single JSON-LD graph. */
export interface StoryJsonLd {
  readonly '@context': typeof schemaOrg
  readonly '@graph': readonly [JsonLdArticle, JsonLdBreadcrumbList]
}

/** The publication: the site's name and its home page on the canonical origin. */
export function publicationOrganization(): JsonLdOrganization {
  return { '@type': 'Organization', name: siteName, url: absolute('/') }
}

function person(author: AuthorLink): JsonLdPerson {
  return { '@type': 'Person', name: author.name, url: absolute(author.href) }
}

/** Stored dimensions go out only as a pair, as the story's Open Graph image gives them. */
function imageObject(image: ReaderImage): JsonLdImage {
  return {
    '@type': 'ImageObject',
    ...(image.width !== null && image.height !== null
      ? { height: image.height, width: image.width }
      : {}),
    url: absolute(image.src),
  }
}

function article(view: ArticleView, url: string): JsonLdArticle {
  // The lead image, or else the first image in the story, as a story card chooses its image.
  const image = view.hero ?? firstImage(view.body)
  return {
    '@type': 'Article',
    ...(view.section ? { articleSection: view.section.name } : {}),
    ...(view.authorLinks.length > 0 ? { author: view.authorLinks.map(person) } : {}),
    datePublished: view.publishedAt,
    ...(view.dek ? { description: view.dek } : {}),
    headline: view.title,
    ...(image ? { image: imageObject(image) } : {}),
    ...(view.topics.length > 0 ? { keywords: view.topics.map(({ name }) => name) } : {}),
    mainEntityOfPage: url,
    publisher: publicationOrganization(),
    url,
  }
}

/** The front page, then the story's section when it has one, then the story. */
function breadcrumbs(view: ArticleView, url: string): JsonLdBreadcrumbList {
  const trail = [
    { item: absolute('/'), name: siteName },
    ...(view.section
      ? [{ item: canonicalSectionUrl(view.section.slug), name: view.section.name }]
      : []),
    { item: url, name: view.title },
  ]
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index): JsonLdListItem => ({
      '@type': 'ListItem',
      ...crumb,
      position: index + 1,
    })),
  }
}

/** The structured data of one published story. */
export function storyStructuredData(view: ArticleView): StoryJsonLd {
  const url = canonicalArticleUrl(view.slug)
  return { '@context': schemaOrg, '@graph': [article(view, url), breadcrumbs(view, url)] }
}

/**
 * The text of a `<script type="application/ld+json">`. JSON.stringify leaves `<`, `>` and `&` as
 * they are, so a stored title or name holding `</script>` or `<!--` could end the element early or
 * change how the HTML parser reads the rest of it. As JSON escapes they stay inside their strings
 * and parse back to the same characters. U+2028 and U+2029 are escaped too: JSON allows them raw,
 * but JavaScript before ES2019 does not.
 */
export function serializeJsonLd(data: StoryJsonLd): string {
  return JSON.stringify(data).replace(
    /[<>&\u{2028}\u{2029}]/gu,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  )
}
