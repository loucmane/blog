// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'

describe('Button', () => {
  it('exposes an accessible name and handles owner interaction', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={onClick}>Publish preview</Button>)

    const button = screen.getByRole('button', { name: 'Publish preview' })
    expect(button).toBeVisible()

    await user.click(button)

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('uses the secondary visual treatment when requested', () => {
    render(<Button variant="secondary">Save draft</Button>)

    expect(screen.getByRole('button', { name: 'Save draft' })).toHaveStyle({
      backgroundColor: '#6c757d',
    })
  })
})
