import type { ReactNode } from 'react'

import {
  readerDirectionFontClassName,
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
 * The element a direction renders inside. It applies the direction's font variables and hoists its
 * tokens and styles into the document head, so a direction's assets load only with that direction.
 */
export function ReaderDirectionRoot({
  cacheGeneration,
  children,
  direction,
}: ReaderDirectionRootProps) {
  const tokens = readerDirectionTokenCss(direction)
  const styles = readerDirectionStyleCss(direction)
  return (
    <div
      className={readerDirectionFontClassName(direction)}
      data-reader-cache-generation={cacheGeneration}
      data-reader-direction={direction.id}
    >
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
