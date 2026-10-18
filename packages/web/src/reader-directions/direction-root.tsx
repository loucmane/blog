import type { ReactNode } from 'react'

import {
  readerDirectionFontCss,
  readerDirectionStyleCss,
  readerDirectionTokenCss,
  type ReaderDirection,
} from './contract'

interface ReaderDirectionRootProps {
  readonly cacheGeneration?: string | undefined
  readonly children: ReactNode
  readonly direction: ReaderDirection
}

/**
 * The element a direction renders inside. Font rules belong to this root's lifetime; tokens and
 * styles are hoisted into the head. Only the selected direction emits assets.
 */
export function ReaderDirectionRoot({
  cacheGeneration,
  children,
  direction,
}: ReaderDirectionRootProps) {
  const tokens = readerDirectionTokenCss(direction)
  const styles = readerDirectionStyleCss(direction)
  const fonts = readerDirectionFontCss(direction)
  return (
    <div data-reader-cache-generation={cacheGeneration} data-reader-direction={direction.id}>
      {fonts ? <style data-reader-direction-fonts={direction.id}>{fonts}</style> : null}
      {tokens ? (
        <style href={`reader-direction-tokens-${direction.id}`} precedence="reader-direction">
          {tokens}
        </style>
      ) : null}
      {styles ? (
        <style href={`reader-direction-styles-${direction.id}`} precedence="reader-direction">
          {styles}
        </style>
      ) : null}
      {children}
    </div>
  )
}
