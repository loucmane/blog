import { vi } from 'vitest'

// next/font is a build transform, not a callable runtime module under Vitest.
// Keep this mock in the web package so pnpm resolves its Next dependency.
vi.mock('next/font/google', () => ({
  Cormorant_Garamond: () => ({
    className: 'qm-display',
    style: { fontFamily: 'Cormorant Garamond' },
    variable: 'qm-display-variable',
  }),
  Jost: () => ({
    className: 'qm-text',
    style: { fontFamily: 'Jost' },
    variable: 'qm-text-variable',
  }),
}))
