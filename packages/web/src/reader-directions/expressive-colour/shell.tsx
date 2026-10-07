import Link from 'next/link'
import type { ReactNode } from 'react'

import { siteName } from '@/reader/components/site-header'
import type { ReaderNavigation } from '@/reader/views'

import { ExpressiveImagePreload, type ExpressiveLeadImage } from './image-preload'

export function ExpressiveShell({
  children,
  isHome = false,
  navigation,
  currentSection,
  leadImage,
}: {
  readonly children: ReactNode
  readonly isHome?: boolean
  readonly navigation: ReaderNavigation
  readonly currentSection?: string | undefined
  readonly leadImage?: ExpressiveLeadImage | null
}) {
  const Brand = isHome ? 'h1' : 'p'
  const finalSpace = siteName.lastIndexOf(' ')
  return (
    <div className="ec-page">
      {leadImage ? <ExpressiveImagePreload {...leadImage} /> : null}
      <a className="ec-skip" href="#ec-main">
        Skip to stories
      </a>
      <header className="ec-masthead">
        <Brand className="ec-wordmark">
          <Link href="/">
            {finalSpace < 0 ? (
              siteName
            ) : (
              <>
                {siteName.slice(0, finalSpace)} <em>{siteName.slice(finalSpace + 1)}</em>
              </>
            )}
          </Link>
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
      <main id="ec-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="ec-footer">
        <p>{siteName}</p>
        <Link href="/">
          All stories <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </div>
  )
}
