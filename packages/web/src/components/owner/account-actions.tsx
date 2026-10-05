'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ownerAuthClient } from '@/lib/owner-auth-client'

export function AccountActions() {
  const router = useRouter()
  const [message, setMessage] = useState('')

  async function addPasskey() {
    setMessage('Follow your device prompt to add a passkey…')
    const result = await ownerAuthClient.passkey.addPasskey({ name: 'Magazine owner passkey' })
    setMessage(
      result.error ? 'The passkey was not added. Try again.' : 'Passkey added successfully.',
    )
  }

  async function signOut() {
    await ownerAuthClient.signOut()
    router.push('/owner/sign-in')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <button
        className="min-h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground"
        onClick={() => void addPasskey()}
        type="button"
      >
        Add a passkey
      </button>
      <button
        className="min-h-11 w-full rounded-md border border-border bg-background px-4 font-semibold"
        onClick={() => void signOut()}
        type="button"
      >
        Sign out
      </button>
      <p aria-live="polite" className="text-sm" role="status">
        {message}
      </p>
    </div>
  )
}
