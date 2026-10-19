'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface CompareFrameItem {
  readonly id: string
  readonly name: string
  readonly thesis: string
  readonly content: ReactNode
  readonly open: ReactNode
}

const frameDocument =
  '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Reader Lab preview</title></head><body><div id="comparison-root"></div></body></html>'
const control =
  'min-h-11 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * A same-origin, scriptless document avoids changing the site's anti-framing headers. React
 * portals the server-rendered view into that document: fonts and hoisted direction styles live
 * there, never in the workspace document. Only the app's shared stylesheet is copied over.
 */
function CompareFrame({
  content,
  name,
  width,
}: {
  readonly content: ReactNode
  readonly name: string
  readonly width: number
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  // The srcdoc load event can precede hydration on a server-rendered page.
  useEffect(() => {
    setTarget(frameRef.current?.contentDocument?.getElementById('comparison-root') ?? null)
  }, [])
  useEffect(() => {
    if (!target) return
    const child = target.ownerDocument
    child.title = `${name} — Reader Lab preview`
    const sharedStylesEnd = child.createElement('meta')
    child.head.prepend(sharedStylesEnd)
    const copies = new Map<Element, Element>()
    const sync = () => {
      const sources = [...document.head.querySelectorAll('link[rel="stylesheet"], style')].filter(
        (node) =>
          !node.hasAttribute('data-reader-direction-fonts') &&
          !/reader-direction-/.test(
            node.getAttribute('data-href') ?? node.getAttribute('href') ?? '',
          ),
      )
      for (const [source, copy] of copies) {
        if (!sources.includes(source)) {
          copy.remove()
          copies.delete(source)
        }
      }
      for (const source of sources) {
        const current = copies.get(source)
        if (current && current.isEqualNode(source)) continue
        const copy = source.cloneNode(true) as Element
        if (current) current.replaceWith(copy)
        else child.head.insertBefore(copy, sharedStylesEnd)
        copies.set(source, copy)
      }
      child.documentElement.className = document.documentElement.className
      child.documentElement.style.colorScheme = document.documentElement.style.colorScheme
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    // srcdoc inherits the parent's base URL. Handle fragments locally so a skip link cannot
    // navigate the frame to the workspace URL (which correctly refuses URL-based framing).
    const keepPage = (event: Event) => {
      const element = event.target as Element | null
      const link = element?.closest?.('a[href]')
      if (!link) return
      event.preventDefault()
      event.stopPropagation()
      const href = link.getAttribute('href') ?? ''
      if (event.type === 'click' && href.startsWith('#')) {
        let id: string
        try {
          id = decodeURIComponent(href.slice(1))
        } catch {
          return
        }
        const destination = child.getElementById(id)
        if (!destination) return
        destination.scrollIntoView({ block: 'start' })
        if (!destination.hasAttribute('tabindex')) destination.tabIndex = -1
        destination.focus({ preventScroll: true })
      }
    }
    child.addEventListener('click', keepPage, true)
    child.addEventListener('auxclick', keepPage, true)
    return () => {
      observer.disconnect()
      child.removeEventListener('click', keepPage, true)
      child.removeEventListener('auxclick', keepPage, true)
      for (const copy of copies.values()) copy.remove()
      sharedStylesEnd.remove()
    }
  }, [target, name])

  return (
    <>
      <iframe
        className="block border-0 bg-background"
        height={800}
        onLoad={(event) =>
          setTarget(event.currentTarget.contentDocument?.getElementById('comparison-root') ?? null)
        }
        ref={frameRef}
        sandbox="allow-same-origin"
        srcDoc={frameDocument}
        style={{ width, height: 'min(75vh, 900px)', minHeight: 480 }}
        title={`${name} — selected page preview`}
        width={width}
      />
      {target ? createPortal(content, target) : null}
    </>
  )
}

export function CompareFrames({ items }: { readonly items: readonly CompareFrameItem[] }) {
  const [width, setWidth] = useState(390)
  return (
    <section aria-label="Direction comparison" className="mt-8">
      <fieldset className="flex flex-wrap items-center gap-3">
        <legend className="mb-2 font-semibold">Preview width</legend>
        {[
          { label: 'Mobile', width: 390 },
          { label: 'Desktop', width: 1440 },
        ].map((preset) => (
          <label
            className={`${control} inline-flex cursor-pointer items-center gap-2`}
            key={preset.width}
          >
            <input
              checked={width === preset.width}
              name="preview-width"
              onChange={() => setWidth(preset.width)}
              type="radio"
              value={preset.width}
            />
            {preset.label} · {preset.width} px
          </label>
        ))}
      </fieldset>
      <p className="mt-3 text-sm text-muted-foreground" id="comparison-scroll-help">
        Scroll across to compare directions. Each preview stays on the selected page; open it in
        Reader Lab to follow links.
      </p>
      <div
        aria-describedby="comparison-scroll-help"
        aria-label="Preview panels"
        className="relative mt-4 overflow-x-auto rounded-xl border border-border focus-visible:outline-2 focus-visible:outline-ring"
        role="region"
        // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- Keyboard users need a focus target to scroll the preview region.
        tabIndex={0}
      >
        <ol className="flex w-max gap-6 p-4">
          {items.map((item) => (
            <li
              className="shrink-0 overflow-hidden rounded-lg border border-border bg-card"
              data-compare-direction={item.id}
              key={item.id}
              style={{ width }}
            >
              <header className="space-y-3 border-b border-border p-4">
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="text-sm text-muted-foreground">{item.thesis}</p>
                {item.open}
              </header>
              <CompareFrame content={item.content} name={item.name} width={width} />
            </li>
          ))}
        </ol>
      </div>
      <noscript>
        Enable JavaScript for side-by-side previews, or use an Open in Reader Lab button to view the
        selected page.
      </noscript>
    </section>
  )
}
