import Image from 'next/image'

import type { ContentMark, ContentNode } from '@/server/content/document'

function markedText(text: string, marks: readonly ContentMark[] = []) {
  return marks.reduce<React.ReactNode>((content, mark) => {
    const key = `${mark.type}:${JSON.stringify(mark.attrs ?? {})}`
    switch (mark.type) {
      case 'bold':
        return <strong key={key}>{content}</strong>
      case 'code':
        return <code key={key}>{content}</code>
      case 'italic':
        return <em key={key}>{content}</em>
      case 'strike':
        return <s key={key}>{content}</s>
      case 'underline':
        return <u key={key}>{content}</u>
      case 'link': {
        const href = String(mark.attrs?.href ?? '')
        return (
          <a className="underline" href={href} key={key} rel="noreferrer">
            {content}
          </a>
        )
      }
    }
  }, text)
}

function children(node: ContentNode) {
  return node.content?.map((child) => <ContentNodeView key={JSON.stringify(child)} node={child} />)
}

function ContentNodeView({ node }: { readonly node: ContentNode }): React.ReactNode {
  if (node.type === 'text') return markedText(node.text ?? '', node.marks)
  switch (node.type) {
    case 'doc':
      return <>{children(node)}</>
    case 'paragraph':
      return <p>{children(node)}</p>
    case 'heading': {
      const level = Number(node.attrs?.level ?? 2)
      if (level === 3) return <h3>{children(node)}</h3>
      if (level === 4) return <h4>{children(node)}</h4>
      if (level === 5) return <h5>{children(node)}</h5>
      if (level === 6) return <h6>{children(node)}</h6>
      return <h2>{children(node)}</h2>
    }
    case 'blockquote':
      return <blockquote>{children(node)}</blockquote>
    case 'bulletList':
      return <ul>{children(node)}</ul>
    case 'orderedList':
      return <ol start={Number(node.attrs?.start ?? 1)}>{children(node)}</ol>
    case 'listItem':
      return <li>{children(node)}</li>
    case 'taskList':
      return <ul className="list-none pl-0">{children(node)}</ul>
    case 'taskItem':
      return (
        <li className="flex gap-2">
          <input
            aria-label="Checklist item"
            checked={Boolean(node.attrs?.checked)}
            disabled
            type="checkbox"
          />
          <div>{children(node)}</div>
        </li>
      )
    case 'codeBlock':
      return (
        <pre>
          <code>{children(node)}</code>
        </pre>
      )
    case 'hardBreak':
      return <br />
    case 'horizontalRule':
      return <hr />
    case 'callout':
      return (
        <aside
          aria-label={String(node.attrs?.label ?? 'Note')}
          className="rounded-lg border-l-4 border-primary bg-muted p-4"
        >
          {children(node)}
        </aside>
      )
    case 'pullQuote':
      return (
        <figure>
          <blockquote>{children(node)}</blockquote>
          <figcaption>{String(node.attrs?.attribution ?? '')}</figcaption>
        </figure>
      )
    case 'mediaImage': {
      const credit = node.attrs?.credit as { name?: unknown } | undefined
      const mediaId = String(node.attrs?.mediaId ?? '')
      return (
        <figure>
          <Image
            alt={String(node.attrs?.alt ?? '')}
            className="h-auto w-full rounded-lg"
            height={800}
            src={`/api/owner/media/${encodeURIComponent(mediaId)}`}
            unoptimized
            width={1200}
          />
          <figcaption>
            {[node.attrs?.caption, credit?.name].filter(Boolean).map(String).join(' · ')}
          </figcaption>
        </figure>
      )
    }
    case 'gallery': {
      const items = Array.isArray(node.attrs?.items)
        ? (node.attrs.items as Array<Record<string, unknown>>)
        : []
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <figure key={`${String(item.mediaId)}:${String(item.caption ?? '')}`}>
              <Image
                alt={String(item.alt ?? '')}
                className="h-auto w-full rounded-lg"
                height={800}
                src={`/api/owner/media/${encodeURIComponent(String(item.mediaId ?? ''))}`}
                unoptimized
                width={1200}
              />
              <figcaption>{String(item.caption ?? '')}</figcaption>
            </figure>
          ))}
        </div>
      )
    }
    case 'embed':
      return (
        <aside className="rounded-lg border border-border p-4">
          <strong>{String(node.attrs?.title ?? 'Embedded media')}</strong>
          <p>{String(node.attrs?.fallback ?? '')}</p>
          <a className="underline" href={String(node.attrs?.url ?? '')} rel="noreferrer">
            Open media source
          </a>
        </aside>
      )
    case 'editorialBlock':
      return (
        <section className="rounded-lg border border-border bg-muted/40 p-5">
          {children(node)}
        </section>
      )
  }
}

export function ContentRenderer({ document }: { readonly document: ContentNode }) {
  return (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <ContentNodeView node={document} />
    </div>
  )
}
