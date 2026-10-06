import type { ArticleTaxonomy, TaxonomyTerm } from './domain'
import { assertValidSlug } from './domain'
import { ContentNotFoundError, InvalidContentTransitionError } from './errors'
import type { Clock, ContentRepository, IdentifierSource } from './ports'
import { RandomIdentifierSource, SystemClock } from './service'

export const maxSectionNameLength = 120

export interface EnsureSectionInput {
  readonly id?: string
  readonly name: string
  readonly slug: string
}

export interface AssignSectionInput {
  readonly actorId?: string | null
  readonly articleId: string
  readonly sectionId: string
}

function assertSectionName(value: string): string {
  const name = value.trim()
  if (name.length === 0 || name.length > maxSectionNameLength) {
    throw new InvalidContentTransitionError(
      `Section names must contain 1 to ${maxSectionNameLength} characters.`,
    )
  }
  return name
}

/**
 * Sections are `section` taxonomy terms. Both operations are idempotent: an existing section is
 * returned unchanged, and an existing article link is kept. A story's primary section is the
 * section link with the lowest position.
 */
export class SectionService {
  constructor(
    private readonly repository: ContentRepository,
    private readonly clock: Clock = new SystemClock(),
    private readonly identifiers: IdentifierSource = new RandomIdentifierSource(),
  ) {}

  async ensureSection(input: EnsureSectionInput): Promise<TaxonomyTerm> {
    const slug = assertValidSlug(input.slug)
    const name = assertSectionName(input.name)
    return this.repository.transaction(async (transaction) => {
      const existing = (await transaction.listTaxonomyTerms()).find(
        (term) => term.kind === 'section' && term.slug === slug,
      )
      if (existing) return existing
      const now = this.clock.now().toISOString()
      const section: TaxonomyTerm = {
        createdAt: now,
        id: input.id ?? this.identifiers.next('section'),
        kind: 'section',
        name,
        slug,
        updatedAt: now,
      }
      await transaction.saveTaxonomyTerm(section)
      transaction.recordPublicationChange()
      return section
    })
  }

  async assignSection(input: AssignSectionInput): Promise<ArticleTaxonomy> {
    return this.repository.transaction(async (transaction) => {
      const article = await transaction.getArticle(input.articleId)
      if (!article) throw new ContentNotFoundError('Article', input.articleId)
      const section = (await transaction.listTaxonomyTerms()).find(
        (term) => term.kind === 'section' && term.id === input.sectionId,
      )
      if (!section) throw new ContentNotFoundError('Section', input.sectionId)
      const links = (await transaction.listArticleTaxonomies()).filter(
        (link) => link.articleId === article.id,
      )
      const existing = links.find((link) => link.taxonomyId === section.id)
      if (existing) return existing
      const link: ArticleTaxonomy = {
        articleId: article.id,
        position: Math.max(-1, ...links.map(({ position }) => position)) + 1,
        taxonomyId: section.id,
      }
      const now = this.clock.now().toISOString()
      await transaction.saveArticleTaxonomy(link)
      transaction.recordPublicationChange()
      await transaction.saveAuditEvent({
        action: 'article.section-assigned',
        actorId: input.actorId ?? null,
        articleId: article.id,
        createdAt: now,
        id: this.identifiers.next('audit'),
        metadata: { sectionId: section.id, sectionSlug: section.slug },
      })
      return link
    })
  }
}
