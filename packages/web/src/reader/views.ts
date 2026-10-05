import type { PublicMediaPath, SectionPath, StoryPath } from './paths'

/*
 * Direction-neutral reader view models. Every field a public design needs comes from these
 * shapes; pages and design directions never read storage types. All values are plain JSON so a
 * view can live in the Next data cache unchanged.
 */

export interface ReaderImage {
  readonly alt: string
  readonly caption: string | null
  readonly credit: { readonly name: string; readonly url: string | null } | null
  readonly focalPoint: { readonly x: number; readonly y: number }
  /** Stored pixel height, or null when the original was saved without dimensions. */
  readonly height: number | null
  readonly mediaId: string
  readonly src: PublicMediaPath
  /** Stored pixel width, or null when the original was saved without dimensions. */
  readonly width: number | null
}

export interface SectionLink {
  readonly href: SectionPath
  readonly name: string
  readonly slug: string
}

export interface ReaderNavigation {
  /** Sections with at least one visible story, by name. */
  readonly sections: readonly SectionLink[]
}

export interface StoryCard {
  readonly dek: string
  readonly href: StoryPath
  /** The lead image, or else the first image in the story; null for a story without images. */
  readonly image: ReaderImage | null
  /** ISO 8601 timestamp of the visible publication. */
  readonly publishedAt: string
  readonly readingMinutes: number
  readonly section: SectionLink | null
  readonly slug: string
  readonly title: string
}

export interface HomeView {
  /** The newest visible story, or null when nothing is published. */
  readonly lead: StoryCard | null
  readonly navigation: ReaderNavigation
  /** The next newest stories after the lead, newest first. */
  readonly recent: readonly StoryCard[]
}

export interface SectionView {
  /** Sections have no stored description yet, so this is null until the taxonomy model has one. */
  readonly description: string | null
  readonly href: SectionPath
  readonly name: string
  readonly navigation: ReaderNavigation
  readonly slug: string
  readonly stories: readonly StoryCard[]
}

export interface ArticleView {
  /** Author display names. Authors are not linked to articles yet, so this is empty for now. */
  readonly authors: readonly string[]
  /** The published document's blocks, without the lead image when it is shown as `hero`. */
  readonly body: readonly ArticleBlock[]
  readonly dek: string
  /** The story's lead image: an image that opens the document. */
  readonly hero: ReaderImage | null
  readonly href: StoryPath
  readonly navigation: ReaderNavigation
  /** ISO 8601 timestamp of the visible publication. */
  readonly publishedAt: string
  readonly readingMinutes: number
  readonly section: SectionLink | null
  readonly slug: string
  readonly title: string
}

export type InlineMark =
  | { readonly kind: 'bold' }
  | { readonly kind: 'code' }
  | { readonly kind: 'italic' }
  | { readonly href: string; readonly kind: 'link' }
  | { readonly kind: 'strike' }
  | { readonly kind: 'underline' }

export type InlineContent =
  | { readonly kind: 'break' }
  | { readonly kind: 'text'; readonly marks: readonly InlineMark[]; readonly text: string }

export interface ListItemBlock {
  readonly blocks: readonly ArticleBlock[]
}

export interface ChecklistItemBlock {
  readonly blocks: readonly ArticleBlock[]
  readonly checked: boolean
}

export type ArticleBlock =
  | { readonly content: readonly InlineContent[]; readonly kind: 'paragraph' }
  | {
      readonly content: readonly InlineContent[]
      readonly kind: 'heading'
      readonly level: 2 | 3 | 4 | 5 | 6
    }
  | { readonly blocks: readonly ArticleBlock[]; readonly kind: 'quote' }
  | {
      readonly attribution: string
      readonly content: readonly InlineContent[]
      readonly kind: 'pull-quote'
    }
  | { readonly items: readonly ListItemBlock[]; readonly kind: 'bulleted-list' }
  | {
      readonly items: readonly ListItemBlock[]
      readonly kind: 'numbered-list'
      readonly numbering: '1' | 'a' | 'A' | 'i' | 'I'
      readonly start: number
    }
  | { readonly items: readonly ChecklistItemBlock[]; readonly kind: 'checklist' }
  | { readonly image: ReaderImage; readonly kind: 'image' }
  | {
      readonly images: readonly ReaderImage[]
      readonly kind: 'gallery'
      readonly layout: 'carousel' | 'diptych' | 'grid'
    }
  | {
      readonly content: readonly InlineContent[]
      readonly kind: 'callout'
      readonly label: string
      readonly variant: 'note' | 'tip' | 'warning'
    }
  | { readonly kind: 'code'; readonly language: string | null; readonly text: string }
  | { readonly kind: 'divider' }
  | {
      readonly fallback: string
      readonly kind: 'embed'
      readonly provider: 'vimeo' | 'youtube'
      readonly title: string
      readonly url: string
    }
  | {
      readonly blocks: readonly ArticleBlock[]
      readonly kind: 'editorial'
      readonly variant: 'fact-box' | 'key-points' | 'methodology' | 'related-stories'
    }

/** A loaded view, or `unavailable` when no content store is configured for the reader. */
export type ReaderResult<T> =
  | { readonly cacheGeneration: string; readonly status: 'ready'; readonly view: T }
  | { readonly status: 'unavailable' }
