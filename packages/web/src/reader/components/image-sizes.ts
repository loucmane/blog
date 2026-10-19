/** Layout hints for the shared article renderer; hero and card sizes remain separate. */
export interface ReaderImageSizes {
  readonly body: string
  readonly gallery: string
}

export const defaultReaderImageSizes: ReaderImageSizes = Object.freeze({
  body: '(min-width: 768px) 42rem, 100vw',
  gallery: '(min-width: 768px) 42rem, 100vw',
})
