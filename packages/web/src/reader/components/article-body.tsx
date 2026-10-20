import { Fragment, type ReactNode } from 'react'

import type { ArticleBlock, InlineContent, InlineMark } from '../views'
import { defaultReaderImageSizes, type ReaderImageSizes } from './image-sizes'
import { withContentKeys } from './keys'
import { ReaderFigure } from './reader-image'

/*
 * The single renderer for published document blocks. It emits plain semantic HTML with data
 * attributes for block kinds and variants; design directions style this markup instead of
 * reimplementing it.
 */

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
}: {
  readonly blocks: readonly ArticleBlock[]
  readonly imageSizes: ReaderImageSizes
}) {
  return withContentKeys(blocks).map(({ item, key }) => (
    <Block block={item} imageSizes={imageSizes} key={key} />
  ))
}

function Block({
  block,
  imageSizes,
}: {
  readonly block: ArticleBlock
  readonly imageSizes: ReaderImageSizes
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
          <Blocks blocks={block.blocks} imageSizes={imageSizes} />
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
              <Blocks blocks={item.blocks} imageSizes={imageSizes} />
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
              <Blocks blocks={item.blocks} imageSizes={imageSizes} />
            </li>
          ))}
        </ol>
      )
    case 'checklist':
      return (
        <ul data-block="checklist">
          {withContentKeys(block.items).map(({ item, key }) => (
            <li data-checked={item.checked} key={key}>
              <span aria-hidden="true">{item.checked ? '☑' : '☐'} </span>
              <span className="sr-only">{item.checked ? 'Done: ' : 'Not done: '}</span>
              <Blocks blocks={item.blocks} imageSizes={imageSizes} />
            </li>
          ))}
        </ul>
      )
    case 'image':
      return <ReaderFigure image={block.image} sizes={imageSizes.body} />
    case 'gallery':
      return (
        <ul data-block="gallery" data-layout={block.layout}>
          {withContentKeys(block.images).map(({ item, key }) => (
            <li key={key}>
              <ReaderFigure image={item} sizes={imageSizes.gallery} />
            </li>
          ))}
        </ul>
      )
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
          <Blocks blocks={block.blocks} imageSizes={imageSizes} />
        </section>
      )
  }
}

export function ArticleBody({
  blocks,
  imageSizes,
}: {
  readonly blocks: readonly ArticleBlock[]
  readonly imageSizes?: Readonly<Partial<ReaderImageSizes>> | undefined
}) {
  return <Blocks blocks={blocks} imageSizes={{ ...defaultReaderImageSizes, ...imageSizes }} />
}
