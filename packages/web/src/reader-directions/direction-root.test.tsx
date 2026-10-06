// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, it } from 'vitest'

import { ReaderDirectionRoot } from './direction-root'
import { readerDirections } from './registry'

afterEach(cleanup)

it('ships no direction font CSS, files or preloads when rendering baseline', () => {
  const html = renderToStaticMarkup(
    <ReaderDirectionRoot direction={readerDirections.defaultDirection}>
      Baseline
    </ReaderDirectionRoot>,
  )
  expect(html).toContain('data-reader-direction="baseline"')
  expect(html).not.toMatch(/@font-face|woff2|reader-direction-fonts|rel="preload"/)
})

it('emits only the active direction fonts before its content, and removes them on returning to baseline', () => {
  const quiet = readerDirections.find('quiet-monograph')!
  const { container, rerender } = render(
    <ReaderDirectionRoot direction={quiet}>
      <p>Quiet Monograph</p>
    </ReaderDirectionRoot>,
  )
  const style = container.querySelector('style[data-reader-direction-fonts="quiet-monograph"]')!
  expect(style.textContent).toContain('@font-face')
  expect(style.textContent).toContain('/reader-directions/quiet-monograph/fonts/')
  expect(style.nextElementSibling?.textContent).toBe('Quiet Monograph')
  expect(style).not.toHaveAttribute('href')
  expect(style).not.toHaveAttribute('precedence')
  expect(document.head.querySelector('[data-reader-direction-fonts]')).toBeNull()
  expect(container.querySelector('link[rel="preload"][as="font"]')).toBeNull()

  rerender(
    <ReaderDirectionRoot direction={readerDirections.defaultDirection}>
      Baseline
    </ReaderDirectionRoot>,
  )

  expect(document.querySelector('[data-reader-direction-fonts]')).toBeNull()
  expect(container.innerHTML).not.toMatch(/@font-face|woff2/)
})
