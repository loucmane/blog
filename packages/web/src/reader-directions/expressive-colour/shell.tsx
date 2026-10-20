import Link from 'next/link'
import type { ReactNode } from 'react'

import { ThemeMenu } from '@/components/theme-menu'
import { siteName } from '@/reader/components/site-header'
import type { ReaderNavigation, StoryCard } from '@/reader/views'

import { storyColours } from './colours'
import { ExpressiveImagePreload, type ExpressiveLeadImage } from './image-preload'
import { ExpressiveSpineStrip } from './spine-strip'

function Wordmark({ isHome = false }: { readonly isHome?: boolean }) {
  const Brand = isHome ? 'h1' : 'p'
  const finalSpace = siteName.lastIndexOf(' ')
  return (
    <Brand className={`ec-wordmark${isHome ? ' ec-wordmark-home' : ''}`}>
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
  )
}

function Navigation({
  label,
  navigation,
  isHome,
  currentSection,
}: {
  readonly label: string
  readonly navigation: ReaderNavigation
  readonly isHome: boolean
  readonly currentSection?: string | undefined
}) {
  return (
    <nav className="ec-navigation" aria-label={label}>
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
  )
}

export function ExpressiveShell({
  children,
  isHome = false,
  navigation,
  currentSection,
  leadImage,
  stories = [],
}: {
  readonly children: ReactNode
  readonly isHome?: boolean
  readonly navigation: ReaderNavigation
  readonly currentSection?: string | undefined
  readonly leadImage?: ExpressiveLeadImage | null
  readonly stories?: readonly StoryCard[]
}) {
  return (
    <div className="ec-page">
      {leadImage ? <ExpressiveImagePreload {...leadImage} /> : null}
      <a className="ec-skip" href="#ec-main">
        Skip to content
      </a>
      <header className="ec-masthead">
        <div className="ec-masthead-row">
          <Wordmark isHome={isHome} />
          <ThemeMenu />
        </div>
        <Navigation
          label="Sections"
          navigation={navigation}
          isHome={isHome}
          currentSection={currentSection}
        />
        {isHome ? <ExpressiveSpineStrip stories={stories} /> : null}
      </header>
      <main id="ec-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="ec-footer">
        <div className="ec-footer-stripe" aria-hidden="true">
          {storyColours.map(({ name }) => (
            <span key={name} data-story-colour={name} />
          ))}
        </div>
        <div className="ec-footer-row">
          <Wordmark />
          <Navigation
            label="Footer"
            navigation={navigation}
            isHome={isHome}
            currentSection={currentSection}
          />
        </div>
      </footer>
    </div>
  )
}
