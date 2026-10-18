import Link from 'next/link'
import type { ReactNode } from 'react'

import { siteName } from '@/reader/components/site-header'
import type { ReaderNavigation } from '@/reader/views'

import { SwissImagePreload, type SwissLeadImage } from './image-preload'

export function SwissShell({
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
  readonly leadImage?: SwissLeadImage | null
}) {
  const Brand = isHome ? 'h1' : 'p'
  const [firstWord, ...remainingWords] = siteName.split(' ')
  return (
    <div className="si-page">
      {leadImage ? <SwissImagePreload {...leadImage} /> : null}
      <a className="si-skip" href="#si-main">
        Skip to stories
      </a>
      <header className="si-masthead">
        <Brand className="si-wordmark">
          <Link href="/">
            <span>{firstWord}</span>
            {remainingWords.length ? (
              <>
                {' '}
                <span>{remainingWords.join(' ')}</span>
              </>
            ) : null}
          </Link>
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
      <main id="si-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="si-footer">
        <p>{siteName}</p>
        <Link href="/">
          All stories <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </div>
  )
}
