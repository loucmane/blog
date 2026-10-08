// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { state } = vi.hoisted(() => ({ state: vi.fn() }))
vi.mock('@/server/owner/setup', () => ({ ownerSetupPageState: state }))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))
vi.mock('@/components/owner/setup-form', () => ({
  OwnerSetupForm: ({ email }: { email: string }) => <form aria-label={email} />,
}))

import OwnerSetupPage from './page'

beforeEach(() => state.mockReset())
describe('owner setup page', () => {
  it('renders a form for the configured email only while setup is available', async () => {
    state.mockResolvedValue({ email: 'owner@example.com', ready: false })
    expect(renderToStaticMarkup(await OwnerSetupPage())).toContain(
      '<form aria-label="owner@example.com"',
    )
  })
  it('shows sign-in without a form after setup', async () => {
    state.mockResolvedValue({ email: 'owner@example.com', ready: true })
    const html = renderToStaticMarkup(await OwnerSetupPage())
    expect(html).toContain('Your account is ready')
    expect(html).toContain('/owner/sign-in')
    expect(html).not.toContain('<form')
  })
  it('returns not found when disabled or unavailable', async () => {
    state.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('database unavailable'))
    await expect(OwnerSetupPage()).rejects.toThrow('NOT_FOUND')
    await expect(OwnerSetupPage()).rejects.toThrow('NOT_FOUND')
  })
})
