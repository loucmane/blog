// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '../../providers/ThemeProvider'
import { ThemeSwitcher } from './ThemeSwitcher'

describe('ThemeSwitcher', () => {
  it('uses the first custom theme when the resolved theme is not available', async () => {
    render(
      <ThemeProvider defaultTheme="gentle" enableSystem={false}>
        <ThemeSwitcher
          showSystem={false}
          themes={[
            {
              value: 'gentle',
              label: 'Owner calm',
              icon: '🕊️',
              description: 'A custom owner theme',
            },
          ]}
        />
      </ThemeProvider>,
    )

    expect(await screen.findByRole('button', { name: 'Expand theme switcher' })).toHaveTextContent(
      '🕊️',
    )
  })
})
