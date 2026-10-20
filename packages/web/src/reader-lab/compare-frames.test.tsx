// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import Link from 'next/link'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CompareFrames } from './compare-frames'

afterEach(() => {
  cleanup()
  document.head.innerHTML = ''
  document.documentElement.className = ''
})

function mountedFrames() {
  const items = ['alpha', 'bravo'].map((id) => ({
    id,
    name: id,
    thesis: 'A comparison fixture.',
    content: (
      <div data-reader-direction={id}>
        <style
          data-reader-direction-fonts={id}
        >{`@font-face { font-family: ${id}; src: url(/${id}.woff2); }`}</style>
        <style
          href={`reader-direction-styles-${id}`}
          precedence="reader-direction"
        >{`[data-reader-direction="${id}"] { color: red; }`}</style>
        <a href="#story-title">Skip to story</a>
        <h1 id="story-title">The same story</h1>
        <Link href="/stories/another-story">Another story</Link>
      </div>
    ),
    open: <button type="button">Open {id}</button>,
  }))
  render(<CompareFrames items={items} />)
  const frames = [...document.querySelectorAll('iframe')]
  // jsdom does not parse srcdoc; browsers create this mount from the fixed srcdoc string.
  for (const frame of frames) {
    const child = frame.contentDocument
    if (!child) throw new Error('Missing frame document')
    child.body.innerHTML = '<div id="comparison-root"></div>'
    fireEvent.load(frame)
  }
  return frames
}

describe('comparison frames', () => {
  it('isolates each direction and its font/style nodes in its own document', () => {
    const frames = mountedFrames()
    expect(document.querySelector('[data-reader-direction]')).toBeNull()
    expect(document.head.textContent).not.toContain('@font-face')
    for (const [index, id] of ['alpha', 'bravo'].entries()) {
      const child = frames[index]?.contentDocument
      expect(child?.querySelector('h1')?.textContent).toBe('The same story')
      expect(child?.querySelectorAll('[data-reader-direction-fonts]')).toHaveLength(1)
      expect(
        child
          ?.querySelector('[data-reader-direction-fonts]')
          ?.getAttribute('data-reader-direction-fonts'),
      ).toBe(id)
      expect(child?.head.querySelector('style[data-href]')?.getAttribute('data-href')).toBe(
        `reader-direction-styles-${id}`,
      )
      expect(frames[index]?.getAttribute('sandbox')).toBe('allow-same-origin')
    }
  })
  it('copies shared stylesheet order and theme, but never a parent direction stylesheet', async () => {
    document.head.innerHTML =
      '<style data-shared="one">body {color: black}</style><style data-shared="two">body {color: blue}</style><style data-href="reader-direction-styles-unrelated">body {color: green}</style>'
    document.documentElement.className = 'dark'
    const frames = mountedFrames()
    for (const frame of frames) {
      expect(
        [...frame.contentDocument!.head.querySelectorAll('[data-shared]')].map((node) =>
          node.getAttribute('data-shared'),
        ),
      ).toEqual(['one', 'two'])
      expect(frame.contentDocument!.head.textContent).not.toContain('green')
      expect(frame.contentDocument!.documentElement.className).toBe('dark')
    }
    await act(async () => {
      document.documentElement.className = 'light'
    })
    expect(frames[0]?.contentDocument?.documentElement.className).toBe('light')
  })
  it('resizes all frame viewports together and keeps previews on the same page', () => {
    const frames = mountedFrames()
    expect(frames.every((frame) => frame.width === '390')).toBe(true)
    fireEvent.click(screen.getByRole('radio', { name: /Desktop/ }))
    expect(frames.every((frame) => frame.width === '1440')).toBe(true)
    const child = frames[0]?.contentDocument
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    child?.querySelector('a[href="/stories/another-story"]')?.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByRole('region', { name: 'Preview panels' }).tabIndex).toBe(0)
    expect(screen.getByRole('button', { name: 'Open alpha' })).toBeVisible()
  })
  it('keeps skip-link scrolling and focus inside the frame despite srcdoc base URL inheritance', () => {
    const frames = mountedFrames()
    const child = frames[0]!.contentDocument!
    const target = child.getElementById('story-title')!
    const scroll = vi.fn()
    target.scrollIntoView = scroll
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    child.querySelector('a[href="#story-title"]')!.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(scroll).toHaveBeenCalledWith({ block: 'start' })
    expect(child.activeElement).toBe(target)
  })
})
