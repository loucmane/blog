import type {
  MediaUploadDto,
  OwnerStoryWorkspaceDto,
  StoryActionDto,
  StoryMutationDto,
} from './types'
import type { Article } from '@/server/content/domain'

export class OwnerApiError extends Error {
  readonly payload: unknown
  readonly status: number

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'OwnerApiError'
    this.payload = payload
    this.status = status
  }
}

async function responsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return response.json()
  return { error: await response.text() }
}

function errorMessage(payload: unknown): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    return payload.error
  }
  return 'The owner service could not complete that action.'
}

export class OwnerApiClient {
  constructor(private readonly basePath = '/api/owner') {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.basePath}${path}`, {
      credentials: 'same-origin',
      ...options,
      headers: { accept: 'application/json', ...options.headers },
    })
    const payload = await responsePayload(response)
    if (!response.ok) throw new OwnerApiError(errorMessage(payload), response.status, payload)
    return payload as T
  }

  listStories(): Promise<{ readonly stories: readonly Article[] }> {
    return this.request('/stories')
  }

  loadStory(articleId: string): Promise<OwnerStoryWorkspaceDto> {
    return this.request(`/stories/${encodeURIComponent(articleId)}`)
  }

  createStory(input: {
    readonly dek: string
    readonly document: unknown
    readonly idempotencyKey: string
    readonly title: string
  }): Promise<StoryMutationDto> {
    return this.request('/stories', {
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
  }

  saveStory(
    articleId: string,
    input: {
      readonly dek: string
      readonly document: unknown
      readonly expectedVersion: number
      readonly idempotencyKey: string
      readonly title: string
    },
  ): Promise<StoryMutationDto> {
    return this.request(`/stories/${encodeURIComponent(articleId)}`, {
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    })
  }

  runStoryAction(
    articleId: string,
    input: Readonly<Record<string, unknown>>,
  ): Promise<StoryActionDto> {
    return this.request(`/stories/${encodeURIComponent(articleId)}/actions`, {
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
  }

  uploadMedia(formData: FormData): Promise<MediaUploadDto> {
    return this.request('/media', { body: formData, method: 'POST' })
  }
}
