import Link from 'next/link'

import { ThemeMenu } from '@/components/theme-menu'

import type { ReaderNavigation } from '../views'

export const siteName = 'Magazine Foundation'

interface SiteHeaderProps {
  /** On the home page the site name is the page's only top-level heading. */
  readonly isHome?: boolean
  readonly navigation: ReaderNavigation
}

export function SiteHeader({ isHome = false, navigation }: SiteHeaderProps) {
  const siteNameClassName = 'font-serif text-2xl font-semibold'
  return (
    <header className="border-b border-border">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
        {isHome ? (
          <h1 className={siteNameClassName}>{siteName}</h1>
        ) : (
          <p className={siteNameClassName}>
            <Link className="underline-offset-4 hover:underline" href="/">
              {siteName}
            </Link>
          </p>
        )}
        <ThemeMenu />
      </div>
      {navigation.sections.length > 0 ? (
        <nav aria-label="Sections" className="container mx-auto px-4 pb-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            {navigation.sections.map((section) => (
              <li key={section.slug}>
                <Link className="underline-offset-4 hover:underline" href={section.href}>
                  {section.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
