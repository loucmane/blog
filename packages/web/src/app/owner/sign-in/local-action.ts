'use server'

import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { requestOriginMatches } from '@/lib/request-security'
import { localOwnerFixture } from '@/server/owner/local-fixture'
import { createOwnerFixtureSession, ownerFixtureCookieName } from '@/server/owner/session'

export async function signInAsLocalOwner(): Promise<void> {
  const requestHeaders = new Headers(await headers())
  const fixture = localOwnerFixture(requestHeaders)
  if (
    !fixture ||
    !requestOriginMatches(
      requestHeaders.get('origin'),
      fixture.baseUrl,
      requestHeaders.get('sec-fetch-site'),
    )
  )
    notFound()

  ;(await cookies()).set(ownerFixtureCookieName, createOwnerFixtureSession(), {
    httpOnly: true,
    maxAge: 60 * 60,
    path: '/',
    sameSite: 'strict',
    secure: fixture.baseUrl.protocol === 'https:',
  })
  redirect('/owner/reader-lab')
}
