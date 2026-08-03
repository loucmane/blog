import type { ComponentType } from 'react'

import type { Article, ArticleRevision, ArticleStatus } from '@/server/content/domain'

export type DesignLabView = 'desk' | 'reader' | 'write'

export interface DesignLabStory {
  readonly body: string
  readonly dek: string
  readonly focalPoint?: Readonly<{ x: number; y: number }>
  readonly image: string
  readonly imageAlt: string
  readonly imageCaption?: string
  readonly imageCredit?: string
  readonly mediaId?: string
  readonly saved: string
  readonly section: string
  readonly server: null | {
    readonly id: string
    readonly revisionId: string
    readonly revisionNumber: number
    readonly version: number
  }
  readonly status: ArticleStatus
  readonly title: string
}

export type EditableStoryField = 'body' | 'dek' | 'title'

export interface DesignLabActions {
  readonly change: (field: EditableStoryField, value: string) => void
  readonly createStory: () => void
  readonly openPublication: () => void
  readonly openUpload: () => void
  readonly setView: (view: DesignLabView) => void
}

export interface DesignLabDirectionProps {
  readonly actions: DesignLabActions
  readonly story: DesignLabStory
}

export interface DesignLabDirectionMetadata {
  readonly character: string
  readonly collection: string
  readonly name: string
  readonly order: string
  readonly ownerFit: string
  readonly risk: string
  readonly signature: string
  readonly thesis: string
}

export interface DesignLabDirection {
  readonly id: string
  readonly metadata: DesignLabDirectionMetadata
  readonly views: Readonly<Record<DesignLabView, ComponentType<DesignLabDirectionProps>>>
}

export interface OwnerStoryWorkspaceDto {
  readonly article: Article
  readonly currentRevision: ArticleRevision
}

export interface StoryMutationDto {
  readonly article: Article
  readonly revision: ArticleRevision
}

export type StoryActionDto = Article | StoryMutationDto

export interface MediaUploadDto {
  readonly asset: {
    readonly alt: string
    readonly caption: string
    readonly creditName: string
    readonly focalX: number
    readonly focalY: number
    readonly id: string
  }
  readonly previewUrl: string
}
