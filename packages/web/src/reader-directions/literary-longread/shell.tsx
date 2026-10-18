import Link from 'next/link'
import type { ReactNode } from 'react'

import { siteName } from '@/reader/components/site-header'
import type { ReaderNavigation, SectionLink } from '@/reader/views'

import { LiteraryImagePreload, type LiteraryLeadImage } from './image-preload'

export function SectionLabel({ section }: { readonly section: SectionLink | null }) {
  return section ? (
    <p className="ll-label">
      <Link href={section.href}>{section.name}</Link>
    </p>
  ) : null
}

export function LiteraryShell({
  children,
  isHome = false,
  navigation,
  currentSection,
  leadImage,
}: {
  readonly children: ReactNode
  readonly isHome?: boolean
  readonly navigation: ReaderNavigation
  readonly currentSection?: string
  readonly leadImage?: LiteraryLeadImage | null
}) {
  const Brand = isHome ? 'h1' : 'p'
  return (
    <div className="ll-page">
      {leadImage ? <LiteraryImagePreload {...leadImage} /> : null}
      <a className="ll-skip" href="#ll-main">
        Skip to stories
      </a>
      <header className="ll-masthead">
        <Brand className="ll-wordmark">
          <Link href="/">{siteName}</Link>
        </Brand>
        <nav aria-label="Sections">
          <ul>
            <li>
              <Link aria-current={isHome ? 'page' : undefined} href="/">
                All stories
              </Link>
            </li>
            {navigation.sections.map((section) => (
              <li key={section.slug}>
                <Link
                  aria-current={currentSection === section.slug ? 'page' : undefined}
                  href={section.href}
                >
                  {section.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="ll-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="ll-footer">
        <p className="ll-footer-brand">{siteName}</p>
        <Link href="/">
          All stories <span aria-hidden="true">↑</span>
        </Link>
      </footer>
    </div>
  )
}
