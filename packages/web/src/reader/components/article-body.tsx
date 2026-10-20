import { Fragment, type ReactNode } from 'react'

import type { ArticleBlock, InlineContent, InlineMark } from '../views'
import { defaultReaderImageSizes, type ReaderImageSizes } from './image-sizes'
import { withContentKeys } from './keys'
import { ReaderFigure } from './reader-image'

/*
 * The single renderer for published document blocks. It emits plain semantic HTML with data
 * attributes for block kinds and variants; design directions style this markup instead of
 * reimplementing it. Checklists and galleries keep an explicit list role, since every direction
 * draws them without markers.
 */

type GalleryLayout = Extract<ArticleBlock, { kind: 'gallery' }>['layout']

/**
 * The `sizes` hints for body images: the shared body and gallery pair, and optional hints for
 * slots a direction lays out differently. An unset hint falls back to the value the image takes
 * without it, so a direction's output changes only where it sets one.
 */
export interface ArticleBodyImageSizes extends ReaderImageSizes {
  /** Gallery items in a carousel. Defaults to `gallery`. */
  readonly carousel?: string
  /** Gallery items in a diptych. Defaults to `gallery`. */
  readonly diptych?: string
  /** Gallery items in a grid. Defaults to `gallery`. */
  readonly grid?: string
  /**
   * Every image nested in a quote, a list or checklist item, or an editorial block, at any depth.
   * It covers gallery items too, since none is wider than the inset it sits in. Defaults to the
   * image's own hint.
   */
  readonly inset?: string
}

/** The hint for an image block, or for a gallery item in the given layout. */
function slotSizes(sizes: ArticleBodyImageSizes, nested: boolean, layout?: GalleryLayout) {
  const own = layout === undefined ? sizes.body : (sizes[layout] ?? sizes.gallery)
  return nested ? (sizes.inset ?? own) : own
}

const editorialLabels = {
  'fact-box': 'Fact box',
  'key-points': 'Key points',
  methodology: 'Methodology',
  'related-stories': 'Related stories',
} as const

/*
 * Markers for numbered lists, set inline. Attribute selectors match `type` case-insensitively
 * (ol[type='a'] also matches type="A"), and the base layer resets list-style on every list, so a
 * stylesheet cannot tell a, A, i and I apart reliably. An inline value wins in every browser.
 */
const listMarkers = {
  '1': 'decimal',
  a: 'lower-alpha',
  A: 'upper-alpha',
  i: 'lower-roman',
  I: 'upper-roman',
} as const

function applyMark(content: ReactNode, mark: InlineMark): ReactNode {
  switch (mark.kind) {
    case 'bold':
      return <strong>{content}</strong>
    case 'code':
      return <code>{content}</code>
    case 'italic':
      return <em>{content}</em>
    case 'link':
      return (
        <a href={mark.href} rel="noreferrer">
          {content}
        </a>
      )
    case 'strike':
      return <s>{content}</s>
    case 'underline':
      return <u>{content}</u>
  }
}

function Inline({ content }: { readonly content: readonly InlineContent[] }) {
  return withContentKeys(content).map(({ item, key }) =>
    item.kind === 'break' ? (
      <br key={key} />
    ) : (
      <Fragment key={key}>{item.marks.reduce<ReactNode>(applyMark, item.text)}</Fragment>
    ),
  )
}

function Blocks({
  blocks,
  imageSizes,
  nested = false,
}: {
  readonly blocks: readonly ArticleBlock[]
  readonly imageSizes: ArticleBodyImageSizes
  /** True inside a quote, a list or checklist item, or an editorial block. */
  readonly nested?: boolean
}) {
  return withContentKeys(blocks).map(({ item, key }) => (
    <Block block={item} imageSizes={imageSizes} key={key} nested={nested} />
  ))
}

function Block({
  block,
  imageSizes,
  nested,
}: {
  readonly block: ArticleBlock
  readonly imageSizes: ArticleBodyImageSizes
  readonly nested: boolean
}) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <p>
          <Inline content={block.content} />
        </p>
      )
    case 'heading': {
      const Heading = `h${block.level}` as const
      return (
        <Heading>
          <Inline content={block.content} />
        </Heading>
      )
    }
    case 'quote':
      return (
        <blockquote>
          <Blocks blocks={block.blocks} imageSizes={imageSizes} nested />
        </blockquote>
      )
    case 'pull-quote':
      return (
        <figure data-block="pull-quote">
          <blockquote>
            <p>
              <Inline content={block.content} />
            </p>
          </blockquote>
          {block.attribution ? <figcaption>{block.attribution}</figcaption> : null}
        </figure>
      )
    case 'bulleted-list':
      return (
        <ul>
          {withContentKeys(block.items).map(({ item, key }) => (
            <li key={key}>
              <Blocks blocks={item.blocks} imageSizes={imageSizes} nested />
            </li>
          ))}
        </ul>
      )
    case 'numbered-list':
      return (
        <ol
          start={block.start}
          style={{ listStyleType: listMarkers[block.numbering] }}
          type={block.numbering}
        >
          {withContentKeys(block.items).map(({ item, key }) => (
            <li key={key}>
              <Blocks blocks={item.blocks} imageSizes={imageSizes} nested />
            </li>
          ))}
        </ol>
      )
    case 'checklist':
      return (
        // eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari.
        <ul data-block="checklist" role="list">
          {withContentKeys(block.items).map(({ item, key }) => (
            <li data-checked={item.checked} key={key}>
              <span aria-hidden="true">{item.checked ? '☑' : '☐'} </span>
              <span className="sr-only">{item.checked ? 'Done: ' : 'Not done: '}</span>
              <Blocks blocks={item.blocks} imageSizes={imageSizes} nested />
            </li>
          ))}
        </ul>
      )
    case 'image':
      return <ReaderFigure image={block.image} sizes={slotSizes(imageSizes, nested)} />
    case 'gallery': {
      const sizes = slotSizes(imageSizes, nested, block.layout)
      return (
        // eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari.
        <ul data-block="gallery" data-layout={block.layout} role="list">
          {withContentKeys(block.images).map(({ item, key }) => (
            <li key={key}>
              <ReaderFigure image={item} sizes={sizes} />
            </li>
          ))}
        </ul>
      )
    }
    case 'callout':
      return (
        <div data-block="callout" data-variant={block.variant} role="note">
          <p>
            <strong>{block.label}</strong>
          </p>
          <p>
            <Inline content={block.content} />
          </p>
        </div>
      )
    case 'code':
      return (
        <pre>
          <code data-language={block.language ?? undefined}>{block.text}</code>
        </pre>
      )
    case 'divider':
      return <hr />
    case 'embed':
      return (
        <figure data-block="embed" data-provider={block.provider}>
          <p>
            <a href={block.url} rel="noreferrer">
              {block.title}
            </a>
          </p>
          {block.fallback ? <figcaption>{block.fallback}</figcaption> : null}
        </figure>
      )
    case 'editorial':
      return (
        <section
          aria-label={editorialLabels[block.variant]}
          data-block="editorial"
          data-variant={block.variant}
        >
          <Blocks blocks={block.blocks} imageSizes={imageSizes} nested />
        </section>
      )
  }
}

export function ArticleBody({
  blocks,
  imageSizes,
}: {
  readonly blocks: readonly ArticleBlock[]
  readonly imageSizes?: Readonly<Partial<ArticleBodyImageSizes>> | undefined
}) {
  return <Blocks blocks={blocks} imageSizes={{ ...defaultReaderImageSizes, ...imageSizes }} />
}
