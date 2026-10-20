import sharp from 'sharp'
import { expect, it } from 'vitest'

import { mediaVariantCandidates } from '@/reader/media-variants'
import { renderMediaVariant } from '@/server/content/media-variants'
import { renderIllustration } from '@/server/lab/illustrations'
import { labImages, labStories } from '@/server/lab/north-house'

it('enforces the lead byte budget on AVIF, WebP and JPEG fallback at mobile/desktop DPR 1 and 2', async () => {
  const lead = [...labStories].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]!
  const mediaId = lead.blocks.find(({ type }) => type === 'mediaImage')?.attrs?.mediaId
  const fixture = labImages.find(({ id }) => id === mediaId)!
  expect(fixture).toBeDefined()
  // North House stores PNG. Derive a JPEG input entirely in memory to exercise
  // the JPEG fallback too; this fixture bound is not a browser/real-photo audit.
  const original = await sharp(renderIllustration(fixture.illustration)).jpeg().toBuffer()
  const candidates = mediaVariantCandidates(fixture.illustration.width)
  for (const viewport of [390, 1440]) {
    for (const dpr of [1, 2]) {
      const candidate =
        candidates.find(({ descriptor }) => descriptor >= viewport * dpr) ?? candidates.at(-1)!
      for (const format of ['avif', 'webp', 'jpeg'] as const) {
        const bytes = await renderMediaVariant({
          contentType: 'image/jpeg',
          original,
          variant: { format, width: candidate.width },
        })
        const message = `${viewport}px DPR ${dpr}, ${format}, ${candidate.descriptor}w`
        expect(bytes.byteLength, message).toBeGreaterThan(0)
        expect(bytes.byteLength, message).toBeLessThanOrEqual((viewport === 390 ? 200 : 350) * 1024)
      }
    }
  }
}, 30_000)
