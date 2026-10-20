import Link from 'next/link'
import type { ReactNode } from 'react'

import { ThemeMenu } from '@/components/theme-menu'
import { siteName } from '@/reader/components/site-header'
import type { SectionPath } from '@/reader/paths'
import type { ReaderNavigation, SectionLink } from '@/reader/views'

import { MonographImagePreload, type MonographLeadImage } from './image-preload'

export function SectionLabel({ section }: { readonly section: SectionLink | null }) {
  return section ? (
    <p className="qm-label">
      <Link href={section.href}>{section.name}</Link>
    </p>
  ) : null
}

interface ContentsLink {
  readonly current: boolean
  readonly href: '/' | SectionPath
  readonly name: string
}

/** "Front page" and every section with a visible story, the current page marked. */
function Contents({ links }: { readonly links: readonly ContentsLink[] }) {
  return (
    <ul>
      {links.map(({ current, href, name }) => (
        <li key={href}>
          <Link aria-current={current ? 'page' : undefined} href={href}>
            {name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * The frame of every page. The masthead holds the wordmark, the Theme control and, below 1024px,
 * the native "Menu" disclosure; from 1024px a navigation row replaces the menu. Both are rendered
 * and CSS hides one, so the accessibility tree has a single "Sections" navigation. Failure pages
 * pass the site name their view supplies.
 */
export function MonographShell({
  children,
  isHome = false,
  navigation,
  currentSection,
  leadImage,
  siteName: name = siteName,
}: {
  readonly children: ReactNode
  readonly isHome?: boolean
  readonly navigation: ReaderNavigation
  readonly currentSection?: string | undefined
  readonly leadImage?: MonographLeadImage | null
  readonly siteName?: string
}) {
  const Brand = isHome ? 'h1' : 'p'
  const contents: ContentsLink[] = [
    { current: isHome, href: '/', name: 'Front page' },
    ...navigation.sections.map((section) => ({
      current: section.slug === currentSection,
      href: section.href,
      name: section.name,
    })),
  ]
  return (
    <div className="qm-page" id="qm-top">
      {leadImage ? <MonographImagePreload {...leadImage} /> : null}
      <a className="qm-skip" href="#qm-main">
        Skip to content
      </a>
      <header className="qm-masthead">
        <Brand className="qm-wordmark">
          <Link href="/">{name}</Link>
        </Brand>
        <ThemeMenu className="qm-theme" />
        <details className="qm-menu">
          <summary>
            Menu
            <span aria-hidden="true" className="qm-menu-mark" />
          </summary>
          <nav aria-label="Sections">
            <Contents links={contents} />
          </nav>
        </details>
        <nav aria-label="Sections" className="qm-nav-row">
          <Contents links={contents} />
        </nav>
      </header>
      <main id="qm-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="qm-footer">
        <p className="qm-footer-brand">{name}</p>
        <nav aria-label="Contents">
          <Contents links={contents} />
        </nav>
        <a href="#qm-top">Back to top</a>
      </footer>
    </div>
  )
}
