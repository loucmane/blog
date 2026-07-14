export type FrameworkStoryStatus = 'draft' | 'published'

export interface FrameworkStory {
  author: string
  body: readonly string[]
  cover: {
    alt: string
    height: number
    src: string
    width: number
  }
  dek: string
  publishedAt: string | null
  readingMinutes: number
  section: string
  slug: string
  status: FrameworkStoryStatus
  title: string
}

const frameworkStories = [
  {
    author: 'Editorial team',
    body: [
      'This retained story is a framework fixture, not the production content model. It proves that the public reader route renders on the server with stable metadata, responsive image dimensions, and a portable cache boundary.',
      'The canonical content schema, rich editor document, database adapter, and publishing workflow remain independently reversible work for the content-platform tasks.',
    ],
    cover: {
      alt: 'Layered editorial pages represented by warm geometric shapes',
      height: 675,
      src: '/images/framework-cover.svg',
      width: 1200,
    },
    dek: 'A small, explicit fixture that proves the selected framework contract without pretending to be production editorial content.',
    publishedAt: '2026-07-14T00:00:00.000Z',
    readingMinutes: 2,
    section: 'Foundation',
    slug: 'framework-migration-proof',
    status: 'published',
    title: 'A portable foundation for the magazine',
  },
  {
    author: 'Editorial team',
    body: [
      'This draft exists only to prove the isolated preview boundary. It must never appear on the public route or in the published story list.',
    ],
    cover: {
      alt: 'A draft page layered behind a published editorial page',
      height: 675,
      src: '/images/framework-cover.svg',
      width: 1200,
    },
    dek: 'A private fixture used to verify draft-mode authorization and no-index metadata.',
    publishedAt: null,
    readingMinutes: 1,
    section: 'Preview',
    slug: 'private-framework-draft',
    status: 'draft',
    title: 'Private framework preview',
  },
] as const satisfies readonly FrameworkStory[]

export function getFrameworkStory(slug: string): FrameworkStory | null {
  return frameworkStories.find((story) => story.slug === slug) ?? null
}

export function getPublishedFrameworkStory(slug: string): FrameworkStory | null {
  const story = getFrameworkStory(slug)
  return story?.status === 'published' ? story : null
}

export function listPublishedFrameworkStories(): readonly FrameworkStory[] {
  return frameworkStories.filter((story) => story.status === 'published')
}

export function storyCacheTag(slug: string): string {
  return `story:${slug}`
}
