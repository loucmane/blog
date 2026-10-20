import type { ReaderImage } from '@/reader/views'

interface CropSlot {
  readonly minWidth?: number
  readonly rem: number
  readonly vw?: number
  readonly ratio?: number
}

/**
 * Width descriptors measure the entire source, including pixels outside a crop.
 * Account for the minimum frame height without changing the shared variant pipeline.
 * Extra height from unusually long cover copy still needs measured browser evidence.
 */
function cropSizes(image: ReaderImage, slots: readonly CropSlot[]): string {
  const sourceRatio = image.width && image.height ? image.width / image.height : 0
  const number = (value: number) => Number(value.toFixed(6))
  return slots
    .map(({ minWidth, rem, vw, ratio = 4 / 3 }) => {
      const scale = Math.max(1, sourceRatio / ratio)
      const size = vw
        ? `calc(${number(vw * scale)}vw - ${number(rem * scale)}rem)`
        : `${number(rem * scale)}rem`
      return `${minWidth ? `(min-width: ${minWidth}px) ` : ''}${size}`
    })
    .join(', ')
}

export function coverSizes(image: ReaderImage) {
  return cropSizes(image, [
    { minWidth: 1344, rem: 39, ratio: 4 / 5 },
    { minWidth: 1024, vw: 50, rem: 3, ratio: 4 / 5 },
    { minWidth: 768, vw: 50, rem: 1.5, ratio: 4 / 5 },
    { vw: 100, rem: 2.5 },
  ])
}

export function cardSizes(image: ReaderImage) {
  return cropSizes(image, [
    { minWidth: 1344, rem: 38.25 },
    { minWidth: 1024, vw: 50, rem: 3.75 },
    { minWidth: 768, vw: 50, rem: 2.25 },
    { vw: 100, rem: 2.5 },
  ])
}

export function relatedSizes(image: ReaderImage) {
  return cropSizes(image, [
    { minWidth: 1344, rem: 25 },
    { minWidth: 1024, vw: 100 / 3, rem: 3 },
    { minWidth: 768, vw: 100, rem: 3 },
    { vw: 100, rem: 2.5 },
  ])
}

export function thumbnailSizes(image: ReaderImage) {
  return cropSizes(image, [{ minWidth: 1024, rem: 10 }, { minWidth: 768, rem: 6 }, { rem: 5 }])
}
