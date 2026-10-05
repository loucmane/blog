'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ResetPasswordForm({ token }: { readonly token: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')

  async function reset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Updating your password…')
    const response = await fetch('/api/auth/reset-password', {
      body: JSON.stringify({ newPassword: password, token }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    if (!response.ok) {
      setMessage('This recovery link is invalid or expired. Request a new one.')
      return
    }
    setMessage('Password updated. You can sign in now.')
    window.setTimeout(() => router.push('/owner/sign-in'), 800)
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={reset}>
      <label className="grid gap-1 text-sm">
        New password
        <input
          autoComplete="new-password"
          className="min-h-12 rounded-md border border-input bg-background px-3"
          minLength={14}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <button
        className="min-h-12 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
        type="submit"
      >
        Save new password
      </button>
      <p aria-live="polite" className="min-h-6 text-sm" role="status">
        {message}
      </p>
    </form>
  )
}
