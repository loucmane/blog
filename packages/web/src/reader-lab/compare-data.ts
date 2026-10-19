import {
  loadArticleView,
  loadAuthorView,
  loadHomeView,
  loadSectionView,
  loadTopicView,
} from '@/reader/cache'
import { normalizeAuthorOrTopicSlug } from '@/reader/paths'
import { normalizeReaderSlug } from '@/reader/slug'
import type { ArticleView, AuthorView, HomeView, SectionView, TopicView } from '@/reader/views'

export type ComparePageView =
  | { readonly kind: 'home'; readonly view: HomeView }
  | { readonly kind: 'story'; readonly view: ArticleView }
  | { readonly kind: 'section'; readonly view: SectionView }
  | { readonly kind: 'author'; readonly view: AuthorView }
  | { readonly kind: 'topic'; readonly view: TopicView }

export type CompareResult =
  | {
      readonly status: 'ready'
      readonly page: ComparePageView
      readonly path: string
      readonly title: string
    }
  | { readonly status: 'invalid' | 'missing' | 'unavailable' }

/** Accept public page paths only; never accept a redirect URL or preview parameters. */
export async function loadComparePage(path: unknown): Promise<CompareResult> {
  if (path === '/') {
    const result = await loadHomeView()
    return result.status === 'ready'
      ? { status: 'ready', page: { kind: 'home', view: result.view }, path, title: 'Home' }
      : result
  }
  if (typeof path !== 'string') return { status: 'invalid' }
  const match = /^\/(stories|sections|authors|topics)\/([^/]+)$/.exec(path)
  if (!match) return { status: 'invalid' }
  const [, type, rawSlug] = match
  const slug =
    type === 'authors' || type === 'topics'
      ? normalizeAuthorOrTopicSlug(rawSlug)
      : normalizeReaderSlug(rawSlug)
  if (!slug) return { status: 'invalid' }
  switch (type) {
    case 'stories': {
      const result = await loadArticleView(slug)
      if (result.status !== 'ready') return result
      return result.view
        ? {
            status: 'ready',
            page: { kind: 'story', view: result.view },
            path,
            title: result.view.title,
          }
        : { status: 'missing' }
    }
    case 'sections': {
      const result = await loadSectionView(slug)
      if (result.status !== 'ready') return result
      return result.view
        ? {
            status: 'ready',
            page: { kind: 'section', view: result.view },
            path,
            title: result.view.name,
          }
        : { status: 'missing' }
    }
    case 'authors': {
      const result = await loadAuthorView(slug)
      if (result.status !== 'ready') return result
      return result.view
        ? {
            status: 'ready',
            page: { kind: 'author', view: result.view },
            path,
            title: result.view.name,
          }
        : { status: 'missing' }
    }
    case 'topics': {
      const result = await loadTopicView(slug)
      if (result.status !== 'ready') return result
      return result.view
        ? {
            status: 'ready',
            page: { kind: 'topic', view: result.view },
            path,
            title: result.view.name,
          }
        : { status: 'missing' }
    }
    default:
      return { status: 'invalid' }
  }
}

export interface CompareChoice {
  readonly kind: ComparePageView['kind']
  readonly path: string
  readonly title: string
}

/** A bounded picker from the reader home, plus credits/topics on those published stories. */
export async function loadCompareChoices(
  selected: CompareResult,
): Promise<readonly CompareChoice[]> {
  const home = await loadHomeView()
  const choices: CompareChoice[] = [{ kind: 'home', path: '/', title: 'Home' }]
  if (home.status === 'ready') {
    choices.push(
      ...home.view.navigation.sections.map((section) => ({
        kind: 'section' as const,
        path: section.href,
        title: section.name,
      })),
    )
    const stories = [...(home.view.lead ? [home.view.lead] : []), ...home.view.recent]
    choices.push(
      ...stories.map((story) => ({ kind: 'story' as const, path: story.href, title: story.title })),
    )
    const articles = await Promise.all(stories.map((story) => loadArticleView(story.slug)))
    for (const result of articles) {
      if (result.status !== 'ready' || !result.view) continue
      choices.push(
        ...result.view.authorLinks.map((author) => ({
          kind: 'author' as const,
          path: author.href,
          title: author.name,
        })),
      )
      choices.push(
        ...result.view.topics.map((topic) => ({
          kind: 'topic' as const,
          path: topic.href,
          title: topic.name,
        })),
      )
    }
  }
  if (selected.status === 'ready') {
    choices.push({ kind: selected.page.kind, path: selected.path, title: selected.title })
    if (selected.page.kind === 'story') {
      choices.push(
        ...selected.page.view.authorLinks.map((author) => ({
          kind: 'author' as const,
          path: author.href,
          title: author.name,
        })),
      )
      choices.push(
        ...selected.page.view.topics.map((topic) => ({
          kind: 'topic' as const,
          path: topic.href,
          title: topic.name,
        })),
      )
    }
  }
  return [...new Map(choices.map((choice) => [choice.path, choice])).values()]
}
