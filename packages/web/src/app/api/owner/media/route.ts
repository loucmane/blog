import { MAX_MEDIA_ORIGINAL_BYTES } from '@/server/content/media'
import { InvalidContentTransitionError } from '@/server/content/errors'
import { assertOwnerMutationRequest, ownerErrorResponse, withOwner } from '@/server/owner/api'
import { ownerMediaMetadataSchema } from '@/server/owner/contracts'
import { getOwnerRuntime } from '@/server/owner/runtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const maxMultipartBytes = MAX_MEDIA_ORIGINAL_BYTES + 64 * 1024

export async function GET(request: Request) {
  return withOwner(request, async () => ({ media: await getOwnerRuntime().workspace.listMedia() }))
}

export async function POST(request: Request) {
  try {
    assertOwnerMutationRequest(request)
    const ownerResponse = await withOwner(request, async () => {
      const declared = request.headers.get('content-length')
      if (!declared || !/^\d+$/.test(declared) || Number(declared) > maxMultipartBytes) {
        throw new InvalidContentTransitionError('This image upload is too large or incomplete.')
      }
      const form = await request.formData()
      const file = form.get('file')
      if (!(file instanceof File))
        throw new InvalidContentTransitionError('Choose an image to upload.')
      if (file.size < 1 || file.size > MAX_MEDIA_ORIGINAL_BYTES) {
        throw new InvalidContentTransitionError('This image upload is too large or incomplete.')
      }
      const metadata = ownerMediaMetadataSchema.parse({
        alt: form.get('alt'),
        caption: form.get('caption') ?? '',
        creditName: form.get('creditName'),
        creditUrl: form.get('creditUrl') ?? '',
        focalX: form.get('focalX') ?? 0.5,
        focalY: form.get('focalY') ?? 0.5,
      })
      const mediaService = getOwnerRuntime().media
      if (!mediaService) {
        throw new InvalidContentTransitionError('Image storage is not configured yet.')
      }
      const asset = await mediaService.store({
        ...metadata,
        body: new Uint8Array(await file.arrayBuffer()),
        contentType: file.type,
        creditUrl: metadata.creditUrl || null,
      })
      return { asset, previewUrl: `/api/owner/media/${asset.id}` }
    })
    return ownerResponse
  } catch (error) {
    return ownerErrorResponse(error)
  }
}
