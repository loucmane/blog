'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function OwnerSetupForm() {
  const router = useRouter()
  const tokenRef = useRef('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Fragments never reach the server or Referer. Keep the value only in memory and remove
    // it from this history entry; do not support a query parameter that would reach logs.
    const fragment = window.location.hash.slice(1)
    if (fragment) {
      try {
        tokenRef.current = decodeURIComponent(fragment)
      } catch {
        tokenRef.current = ''
      }
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }
    if (!tokenRef.current) return
    let active = true
    const controller = new AbortController()
    setMessage('Checking your setup link…')
    const verification = fetch('/api/owner/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
      body: JSON.stringify({ action: 'verify', token: tokenRef.current }),
    }).then(async (response) => {
      const data: unknown = response.ok ? await response.json() : null
      const verifiedEmail =
        data && typeof data === 'object' && 'email' in data && typeof data.email === 'string'
          ? data.email
          : ''
      return { status: response.status, email: verifiedEmail }
    })
    void verification.then(
      (result) => {
        if (!active) return
        if (result.status === 200 && result.email) {
          setEmail(result.email)
          setMessage('Your setup link is ready. Choose your password.')
        } else if (result.status === 404) {
          tokenRef.current = ''
          setMessage('Account setup is unavailable. If your account is ready, sign in below.')
        } else if (result.status === 429) {
          setMessage('Too many attempts. Please wait 15 minutes, then open your setup link again.')
        } else {
          setMessage('This setup link did not work. Reopen your invitation or ask for a new link.')
        }
      },
      () => {
        if (active)
          setMessage('We could not connect. Check your connection, then reopen your setup link.')
      },
    )
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (working || !email || !tokenRef.current) return
    setWorking(true)
    setPasswordError(false)
    setMessage('Creating your account…')
    try {
      const response = await fetch('/api/owner/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ token: tokenRef.current, password }),
      })
      if (response.ok) {
        tokenRef.current = ''
        setPassword('')
        router.replace('/owner/reader-lab')
        router.refresh()
        return
      }
      // Display only local copy; even a proxy/dependency error cannot echo a secret into the DOM.
      if (response.status === 400) {
        setPasswordError(true)
        setMessage('Use between 14 and 128 characters for your password, then try again.')
        passwordRef.current?.focus()
      } else if (response.status === 403) {
        setMessage('This setup link did not work. Ask the person helping you for a new link.')
      } else if (response.status === 429) {
        setMessage('Too many attempts. Please wait 15 minutes, then open your setup link again.')
      } else if (response.status === 404) {
        tokenRef.current = ''
        setEmail('')
        setMessage('Account setup is unavailable. If your account is ready, sign in below.')
      } else {
        setMessage(
          'We could not finish setup. Try again shortly, or sign in if your account is ready.',
        )
      }
    } catch {
      setMessage('We could not connect. Check your connection, then try again.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
      <h1 className="text-4xl font-semibold">Create your password</h1>
      {email ? <p className="mt-3 break-words text-muted-foreground">For {email}</p> : null}
      <p className="mt-3 text-muted-foreground">
        Choose a password to open your private magazine workspace.
      </p>
      {!email ? (
        <p className="mt-4">Open the setup link from your invitation.</p>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="text-sm font-semibold" htmlFor="setup-password">
            Password
          </label>
          <input
            aria-describedby={`setup-rules setup-strength${passwordError ? ' setup-message' : ''}`}
            aria-invalid={passwordError}
            autoComplete="new-password"
            className="min-h-12 min-w-0 rounded-md border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            id="setup-password"
            maxLength={128}
            minLength={14}
            onChange={(event) => {
              setPassword(event.target.value)
              setPasswordError(false)
            }}
            readOnly={working}
            ref={passwordRef}
            required
            type={visible ? 'text' : 'password'}
            value={password}
          />
          <button
            aria-controls="setup-password"
            aria-pressed={visible}
            className="min-h-12 rounded-md border border-border px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => setVisible(!visible)}
            type="button"
          >
            {visible ? 'Hide password' : 'Show password'}
          </button>
          <p className="text-sm text-muted-foreground" id="setup-rules">
            Use 14–128 characters. Spaces are welcome.
          </p>
          <p className="text-sm text-muted-foreground" id="setup-strength">
            For a stronger password, use several unrelated words. Avoid your name or a password you
            use elsewhere.
          </p>
          <button
            className="min-h-12 rounded-md bg-primary px-4 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
            disabled={working}
            type="submit"
          >
            {working ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
      <p aria-live="polite" className="mt-4 min-h-6 text-sm" id="setup-message" role="status">
        {message}
      </p>
      <Link
        className="mt-3 inline-flex min-h-12 items-center rounded-md px-2 text-sm font-semibold text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        href="/owner/sign-in"
      >
        Already have an account? Sign in
      </Link>
    </section>
  )
}
