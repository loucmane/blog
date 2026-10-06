import Link from 'next/link'
import type { ReactNode } from 'react'

import { siteName } from '@/reader/components/site-header'
import type { ReaderNavigation, SectionLink } from '@/reader/views'

export function SectionLabel({ section }: { readonly section: SectionLink | null }) {
  return section ? (
    <p className="qm-label">
      <Link href={section.href}>{section.name}</Link>
    </p>
  ) : null
}

export function MonographShell({
  children,
  isHome = false,
  navigation,
  currentSection,
}: {
  readonly children: ReactNode
  readonly isHome?: boolean
  readonly navigation: ReaderNavigation
  readonly currentSection?: string
}) {
  const Brand = isHome ? 'h1' : 'p'
  return (
    <div className="qm-page">
      <a className="qm-skip" href="#qm-main">
        Skip to stories
      </a>
      <header className="qm-masthead">
        <Brand className="qm-wordmark">
          <Link href="/">{siteName}</Link>
        </Brand>
        <details className="qm-menu">
          <summary>
            Menu
            <span aria-hidden="true" className="qm-menu-mark" />
          </summary>
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
        </details>
      </header>
      <main id="qm-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="qm-footer">
        <p className="qm-footer-brand">{siteName}</p>
        <Link href="/">
          All stories<span aria-hidden="true"> ↗</span>
        </Link>
      </footer>
    </div>
  )
}
