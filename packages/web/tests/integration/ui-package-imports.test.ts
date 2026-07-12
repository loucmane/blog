import { describe, expect, it } from 'vitest'

// Test importing from main entry
import { animations, breakpoints, colors, spacing, typography } from '@minniewinnie/ui'

// Test importing from specific paths
import { useMediaQuery } from '@minniewinnie/ui/hooks/useMediaQuery'
import { useTheme } from '@minniewinnie/ui/hooks/useTheme'
import { ThemeProvider } from '@minniewinnie/ui/providers/ThemeProvider'
import { breakpoints as breakpointsDirectly } from '@minniewinnie/ui/tokens/breakpoints'
import { colors as colorsDirectly } from '@minniewinnie/ui/tokens/colors'
import { contrastTheme } from '@minniewinnie/ui/themes/contrast'
import { darkTheme } from '@minniewinnie/ui/themes/dark'
import { gentleTheme } from '@minniewinnie/ui/themes/gentle'
import { lightTheme } from '@minniewinnie/ui/themes/light'

describe('UI Package Imports', () => {
  it('makes design tokens importable', () => {
    expect(colors).toBeDefined()
    expect(colors.teal).toBeDefined()
    expect(breakpoints).toBeDefined()
    expect(typography).toBeDefined()
    expect(spacing).toBeDefined()
    expect(animations).toBeDefined()
  })

  it('keeps direct token imports equivalent to barrel exports', () => {
    expect(colorsDirectly).toEqual(colors)
    expect(breakpointsDirectly).toEqual(breakpoints)
  })

  it('keeps all four theme contracts importable', () => {
    expect([lightTheme.name, darkTheme.name, contrastTheme.name, gentleTheme.name]).toEqual([
      'light',
      'dark',
      'contrast',
      'gentle',
    ])
  })

  it('exports the theme provider', () => {
    expect(typeof ThemeProvider).toBe('function')
  })

  it('exports theme and media-query hooks', () => {
    expect(typeof useTheme).toBe('function')
    expect(typeof useMediaQuery).toBe('function')
  })
})
