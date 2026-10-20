/** Image slots from the developed direction spec, section 6. */
export const leadSizes =
  '(min-width: 1408px) 690px, (min-width: 1024px) 49vw, (min-width: 768px) 88vw, calc(100vw - 5rem)'
export const secondarySizes =
  '(min-width: 1408px) 590px, (min-width: 768px) 42vw, calc(100vw - 4.5rem)'
export const cardSizes =
  '(min-width: 1408px) 366px, (min-width: 1024px) 26vw, (min-width: 768px) 41vw, calc(100vw - 4.5rem)'
export const heroSizes = '(min-width: 1408px) 1312px, (min-width: 534px) 94vw, calc(100vw - 2rem)'
export const coverSizes =
  '(min-width: 1408px) 472px, (min-width: 1024px) 33vw, (min-width: 613px) 576px, (min-width: 534px) 94vw, calc(100vw - 2rem)'
// The shared hook has one gallery slot. This is the spec's grid hint; separate
// diptych/carousel hints need the shared kit to expose per-layout slots.
export const bodyImageSizes = {
  body: '(min-width: 768px) 720px, (min-width: 534px) 94vw, calc(100vw - 2rem)',
  gallery:
    '(min-width: 1280px) 366px, (min-width: 1024px) 30vw, (min-width: 768px) 46vw, (min-width: 534px) 94vw, calc(100vw - 2rem)',
} as const
