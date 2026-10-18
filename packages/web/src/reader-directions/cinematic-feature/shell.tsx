import Link from 'next/link'
import type { ReactNode } from 'react'

import { siteName } from '@/reader/components/site-header'
import type { ReaderNavigation } from '@/reader/views'

import { CinematicImagePreload, type CinematicLeadImage } from './image-preload'

export function CinematicShell({
  children,
  isHome = false,
  cover = false,
  navigation,
  currentSection,
  leadImage,
}: {
  readonly children: ReactNode
  readonly isHome?: boolean
  readonly cover?: boolean
  readonly navigation: ReaderNavigation
  readonly currentSection?: string
  readonly leadImage?: CinematicLeadImage | null
}) {
  const Brand = isHome ? 'h1' : 'p'
  return (
    <div className={`cf-page${cover ? ' cf-cover-page' : ''}`}>
      {leadImage ? <CinematicImagePreload {...leadImage} /> : null}
      <a className="cf-skip" href="#cf-main">
        Skip to stories
      </a>
      <header className="cf-masthead">
        <Brand className="cf-wordmark">
          <Link href="/">{siteName}</Link>
        </Brand>
        <nav aria-label="Sections">
          <ul>
            <li>
              <Link href="/" aria-current={isHome ? 'page' : undefined}>
                All stories
              </Link>
            </li>
            {navigation.sections.map((section) => (
              <li key={section.slug}>
                <Link
                  href={section.href}
                  aria-current={currentSection === section.slug ? 'page' : undefined}
                >
                  {section.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="cf-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="cf-footer">
        <p>{siteName}</p>
        <Link href="/">
          All stories <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </div>
  )
}
