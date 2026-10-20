// @vitest-environment jsdom

import { readFileSync } from 'node:fs'

import postcss, { type Rule } from 'postcss'
import { afterEach, describe, expect, it } from 'vitest'

import { readerDirections } from '@/reader-directions/registry'

const css = postcss.parse(readFileSync('packages/web/src/app/globals.css', 'utf8'))
const smoothRules: Rule[] = []
css.walkDecls('scroll-behavior', (declaration) => {
  if (declaration.value === 'smooth' && declaration.parent?.type === 'rule') {
    smoothRules.push(declaration.parent)
  }
})

function smoothScrollingApplies() {
  return smoothRules.some((rule) => document.documentElement.matches(rule.selector))
}

function mountDirection(id: string) {
  const root = document.createElement('div')
  root.dataset.readerDirection = id
  document.body.append(root)
  return root
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('global viewport scrolling', () => {
  it('preserves smooth scrolling outside Reader Lab and for the registered public baseline', () => {
    expect(readerDirections.defaultDirection.id).toBe('baseline')
    expect(smoothScrollingApplies()).toBe(true)
    mountDirection(readerDirections.defaultDirection.id)
    expect(smoothScrollingApplies()).toBe(true)
  })

  it.each(readerDirections.directions.filter(({ id }) => id !== 'baseline'))(
    'does not opt $id into smooth viewport scrolling',
    ({ id }) => {
      mountDirection(id)
      expect(smoothScrollingApplies()).toBe(false)
    },
  )

  it('leaves new directions on browser-default scrolling until explicitly opted in', () => {
    mountDirection('future-direction')
    expect(smoothScrollingApplies()).toBe(false)
  })

  it('follows direction changes and removal without retaining a smooth-scroll override', () => {
    const root = mountDirection('baseline')
    expect(smoothScrollingApplies()).toBe(true)
    root.dataset.readerDirection = 'quiet-monograph'
    expect(smoothScrollingApplies()).toBe(false)
    root.dataset.readerDirection = 'baseline'
    expect(smoothScrollingApplies()).toBe(true)
    root.remove()
    expect(smoothScrollingApplies()).toBe(true)
  })

  it('does not enable smooth scrolling when a non-baseline root accompanies baseline markup', () => {
    mountDirection('baseline')
    mountDirection('quiet-monograph')
    expect(smoothScrollingApplies()).toBe(false)
  })

  it('keeps the important reduced-motion override applicable to the viewport', () => {
    const overrides: string[] = []
    css.walkAtRules('media', (media) => {
      if (media.params !== '(prefers-reduced-motion: reduce)') return
      media.walkDecls('scroll-behavior', (declaration) => {
        const rule = declaration.parent
        if (rule?.type === 'rule' && document.documentElement.matches(rule.selector)) {
          expect(declaration.important).toBe(true)
          overrides.push(declaration.value)
        }
      })
    })
    expect(overrides).toEqual(['auto'])
  })
})
