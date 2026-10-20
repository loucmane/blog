import Link from 'next/link'
import type { ReactNode } from 'react'

import { ThemeMenu } from '@/components/theme-menu'
import { siteName } from '@/reader/components/site-header'
import type { ReaderNavigation } from '@/reader/views'

import { SwissImagePreload, type SwissLeadImage } from './image-preload'

interface SwissIndexNavProps {
  readonly currentSection: string | undefined
  readonly isHome: boolean
  readonly label: string
  readonly navigation: ReaderNavigation
}

/** The front page and every section as ruled index cells, with the current page marked. */
function SwissIndexNav({ currentSection, isHome, label, navigation }: SwissIndexNavProps) {
  const cells = [
    { current: isHome, href: '/', name: 'Front page' },
    ...navigation.sections.map((section) => ({
      current: section.slug === currentSection,
      href: section.href,
      name: section.name,
    })),
  ]
  return (
    <nav aria-label={label} className="si-nav">
      <ul>
        {cells.map((cell) => (
          <li data-current={cell.current ? '' : undefined} key={cell.href}>
            <Link aria-current={cell.current ? 'page' : undefined} href={cell.href}>
              {cell.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

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
  const index = { currentSection, isHome, navigation }
  return (
    <div className="si-page" id="si-top">
      {leadImage ? <SwissImagePreload {...leadImage} /> : null}
      <a className="si-skip" href="#si-main">
        Skip to content
      </a>
      <header className="si-masthead">
        <div className="si-masthead-bar">
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
          <ThemeMenu className="si-theme" />
        </div>
        <SwissIndexNav label="Sections" {...index} />
      </header>
      <main id="si-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="si-footer">
        <p className="si-footer-name">{siteName}</p>
        <SwissIndexNav label="Site index" {...index} />
        <a className="si-top-link" href="#si-top">
          Back to top
        </a>
      </footer>
    </div>
  )
}
