'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ownerAuthClient } from '@/lib/owner-auth-client'

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [working, setWorking] = useState(false)

  async function passwordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWorking(true)
    setMessage('Signing in…')
    const result = await ownerAuthClient.signIn.email({ email, password })
    setWorking(false)
    if (result.error) {
      setMessage('We could not sign you in. Check the email and password, then try again.')
      return
    }
    router.push('/owner')
    router.refresh()
  }

  async function passkeySignIn() {
    setWorking(true)
    setMessage('Follow your device prompt to use your passkey…')
    const result = await ownerAuthClient.signIn.passkey()
    setWorking(false)
    if (result?.error) {
      setMessage('The passkey sign-in did not finish. You can retry or use your password.')
      return
    }
    router.push('/owner')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        Private owner workspace
      </p>
      <h1 className="mt-2 text-4xl font-semibold">Welcome back</h1>
      <p className="mt-3 text-muted-foreground">
        Sign in to write, preview, schedule, and publish your magazine.
      </p>
      <button
        className="mt-6 min-h-12 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
        disabled={working}
        onClick={() => void passkeySignIn()}
        type="button"
      >
        Use a passkey
      </button>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or use password
        <span className="h-px flex-1 bg-border" />
      </div>
      <form className="grid gap-4" onSubmit={passwordSignIn}>
        <label className="grid gap-1 text-sm">
          Email
          <input
            autoComplete="username webauthn"
            className="min-h-12 rounded-md border border-input bg-background px-3"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Password
          <input
            autoComplete="current-password"
            className="min-h-12 rounded-md border border-input bg-background px-3"
            minLength={14}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <button
          className="min-h-12 rounded-md border border-border bg-background px-4 font-semibold disabled:opacity-60"
          disabled={working}
          type="submit"
        >
          Sign in
        </button>
      </form>
      <p aria-live="polite" className="mt-4 min-h-6 text-sm" role="status">
        {message}
      </p>
      <Link
        className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
        href="/owner/recover"
      >
        I cannot sign in
      </Link>
    </div>
  )
}
