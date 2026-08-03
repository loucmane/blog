import type { ContentNode } from '@/server/content/document'

import type {
  DesignLabStory,
  OwnerStoryWorkspaceDto,
  StoryActionDto,
  StoryMutationDto,
} from './types'

function textContent(node: ContentNode): string {
  if (node.type === 'text') return node.text ?? ''
  return node.content?.map(textContent).join('') ?? ''
}

function paragraphNode(text: string): ContentNode {
  return text ? { content: [{ text, type: 'text' }], type: 'paragraph' } : { type: 'paragraph' }
}

function mediaNode(story: DesignLabStory): ContentNode | null {
  if (!story.mediaId || !story.imageAlt.trim()) return null
  return {
    attrs: {
      alt: story.imageAlt.trim(),
      caption: story.imageCaption?.trim() ?? '',
      credit: { name: story.imageCredit?.trim() || 'North House', url: null },
      focalPoint: story.focalPoint ?? { x: 0.5, y: 0.5 },
      mediaId: story.mediaId,
    },
    type: 'mediaImage',
  }
}

export function storyToDocument(story: DesignLabStory): ContentNode {
  const content = story.body
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(paragraphNode)
  const leadMedia = mediaNode(story)
  if (leadMedia) content.unshift(leadMedia)
  if (content.length === 0) content.push(paragraphNode(''))
  return { content, type: 'doc' }
}

function documentBody(workspace: OwnerStoryWorkspaceDto): string {
  return (workspace.currentRevision.document.document.content ?? [])
    .filter((node) => node.type !== 'mediaImage')
    .map(textContent)
    .map((text) => text.trim())
    .filter(Boolean)
    .join('\n\n')
}

function documentMedia(workspace: OwnerStoryWorkspaceDto): Partial<DesignLabStory> {
  const node = workspace.currentRevision.document.document.content?.find(
    (candidate) => candidate.type === 'mediaImage',
  )
  const attrs = node?.attrs
  if (!attrs) return {}
  const mediaId = typeof attrs.mediaId === 'string' ? attrs.mediaId : null
  if (!mediaId) return {}
  const credit = typeof attrs.credit === 'object' && attrs.credit !== null ? attrs.credit : null
  const focalPoint =
    typeof attrs.focalPoint === 'object' && attrs.focalPoint !== null
      ? (attrs.focalPoint as Readonly<{ x: number; y: number }>)
      : undefined
  return {
    ...(focalPoint ? { focalPoint } : {}),
    image: `/api/owner/media/${encodeURIComponent(mediaId)}`,
    imageAlt: typeof attrs.alt === 'string' ? attrs.alt : '',
    imageCaption: typeof attrs.caption === 'string' ? attrs.caption : '',
    imageCredit:
      credit && 'name' in credit && typeof credit.name === 'string' ? credit.name : 'North House',
    mediaId,
  }
}

export function mutationIntoStory(story: DesignLabStory, result: StoryMutationDto): DesignLabStory {
  return {
    ...story,
    saved: 'Saved to the protected workspace',
    server: {
      id: result.article.id,
      revisionId: result.revision.id,
      revisionNumber: result.revision.revisionNumber,
      version: result.article.version,
    },
    status: result.article.status,
  }
}

export function actionIntoStory(story: DesignLabStory, result: StoryActionDto): DesignLabStory {
  const article = 'article' in result ? result.article : result
  const revision = 'article' in result ? result.revision : undefined
  if (!story.server) return story
  return {
    ...story,
    saved: 'Saved to the protected workspace',
    server: {
      ...story.server,
      revisionId: revision?.id ?? story.server.revisionId,
      revisionNumber: revision?.revisionNumber ?? story.server.revisionNumber,
      version: article.version,
    },
    status: article.status,
  }
}

export function workspaceIntoStory(
  workspace: OwnerStoryWorkspaceDto,
  fallback: DesignLabStory,
): DesignLabStory {
  return {
    ...fallback,
    ...documentMedia(workspace),
    body: documentBody(workspace) || fallback.body,
    dek: workspace.article.dek,
    saved: 'Loaded from the protected workspace',
    server: {
      id: workspace.article.id,
      revisionId: workspace.currentRevision.id,
      revisionNumber: workspace.currentRevision.revisionNumber,
      version: workspace.article.version,
    },
    status: workspace.article.status,
    title: workspace.article.title,
  }
}
