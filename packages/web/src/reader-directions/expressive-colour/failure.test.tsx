// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { expressiveColourDirection as direction } from './index'

afterEach(cleanup)

describe('Expressive Colour failure pages (spec 2.7)', () => {
  for (const kind of ['NotFound', 'Error', 'Unavailable'] as const) {
    it.each([false, true])(`${kind} keeps its shell with navigation=%s`, (withNavigation) => {
      const Page = direction[kind]
      const view = {
        siteName: 'A Different Magazine',
        navigation: {
          sections: withNavigation
            ? [{ name: 'Rooms', slug: 'rooms', href: '/sections/rooms' as const }]
            : [],
        },
      }
      const { container } = render(<Page view={view} reset={() => {}} />)
      for (const role of ['banner', 'main', 'contentinfo'] as const)
        expect(screen.getAllByRole(role)).toHaveLength(1)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        kind === 'Unavailable'
          ? view.siteName
          : kind === 'NotFound'
            ? 'Page not found'
            : 'Something went wrong',
      )
      if (kind === 'Unavailable')
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
          'Stories are unavailable',
        )
      expect(screen.getByRole('main')).toHaveAttribute('id', 'ec-main')
      expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
      expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
        'href',
        '#ec-main',
      )
      expect(
        within(screen.getByRole('main')).getByRole('link', { name: 'All stories' }),
      ).toHaveAttribute('href', '/')
      for (const label of ['Sections', 'Footer']) {
        const nav = screen.getByRole('navigation', { name: label })
        expect(within(nav).getAllByRole('link')).toHaveLength(withNavigation ? 2 : 1)
        if (withNavigation)
          expect(within(nav).getByRole('link', { name: 'Rooms' })).toHaveAttribute(
            'href',
            '/sections/rooms',
          )
      }
      expect(screen.getAllByRole('link', { name: view.siteName })).toHaveLength(2)
      expect(container.querySelector('.ec-failure')).not.toBeNull()
      expect(container.querySelectorAll('.ec-failure-motif')).toHaveLength(2)
      for (const motif of container.querySelectorAll('.ec-failure-motif'))
        expect(motif).toHaveAttribute('aria-hidden', 'true')
      expect(container.querySelector('img, link[as="image"], [role="alert"]')).toBeNull()
    })
  }

  it('calls the supplied retry action from a button and does not expose error details', () => {
    const reset = vi.fn()
    render(
      <direction.Error
        reset={reset}
        view={{ siteName: 'The Magazine', navigation: { sections: [] } }}
      />,
    )
    const retry = screen.getByRole('button', { name: 'Try again' })
    expect(retry).toHaveAttribute('type', 'button')
    expect(retry).toHaveClass('ec-pill')
    fireEvent.click(retry)
    expect(reset).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('main')).toHaveTextContent(
      'We could not load this page. Please try again.',
    )
    expect(screen.getByRole('main').textContent).not.toMatch(/stack|digest/)
    expect(screen.getByRole('main').querySelector('pre, details')).toBeNull()
  })
})
