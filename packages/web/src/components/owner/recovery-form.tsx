'use client'

import { useState } from 'react'

export function RecoveryForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function requestRecovery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Requesting a secure recovery link…')
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        body: JSON.stringify({ email, redirectTo: '/owner/reset-password' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) throw new Error('delivery unavailable')
      setMessage('If this is the owner account, recovery instructions will arrive shortly.')
    } catch {
      setMessage(
        'Recovery is temporarily unavailable. Try again shortly or use another trusted passkey.',
      )
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={requestRecovery}>
      <label className="grid gap-1 text-sm">
        Owner email
        <input
          autoComplete="email"
          className="min-h-12 rounded-md border border-input bg-background px-3"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <button
        className="min-h-12 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
        type="submit"
      >
        Send recovery link
      </button>
      <p aria-live="polite" className="min-h-6 text-sm" role="status">
        {message}
      </p>
    </form>
  )
}
