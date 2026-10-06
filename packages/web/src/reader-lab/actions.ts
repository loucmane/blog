'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { requestOriginMatches } from '@/lib/request-security'
import { resolveRuntimeSiteUrl } from '@/lib/site-url'
import { loadHomeView } from '@/reader/cache'
import { readerDirections } from '@/reader-directions/registry'
import { OwnerAccessError, resolveOwnerSession } from '@/server/owner/session'

import { readerLabCookieName, readerLabCookieOptions } from './cookie'

/*
 * Reader Lab actions. Each one runs only for a same-origin request, and only the signed-in owner can
 * choose a direction. Setting or clearing the cookie in a Server Action re-renders the current page
 * in the same response, so switching keeps the URL and the scroll position.
 */

async function sameOriginHeaders(): Promise<Headers> {
  const requestHeaders = new Headers(await headers())
  if (
    !requestOriginMatches(
      requestHeaders.get('origin'),
      resolveRuntimeSiteUrl(),
      requestHeaders.get('sec-fetch-site'),
    )
  ) {
    throw new OwnerAccessError()
  }
  return requestHeaders
}

async function hasOwnerSession(requestHeaders: Headers): Promise<boolean> {
  return (await resolveOwnerSession(requestHeaders).catch(() => null)) !== null
}

function requestedDirectionId(formData: FormData): string {
  const value = formData.get('direction')
  const direction = readerDirections.find(typeof value === 'string' ? value : null)
  if (!direction) throw new Error('Choose a direction from the Reader Lab.')
  return direction.id
}

async function destinationPath(formData: FormData): Promise<string> {
  switch (formData.get('destination')) {
    case 'home':
      return '/'
    case 'latest-story': {
      const home = await loadHomeView()
      return home.status === 'ready' && home.view.lead ? home.view.lead.href : '/'
    }
    default:
      throw new Error('Choose where to open the site.')
  }
}

/** Opens the site in a direction, at home or at the newest published story. */
export async function openReaderDirection(formData: FormData): Promise<void> {
  const requestHeaders = await sameOriginHeaders()
  if (!(await hasOwnerSession(requestHeaders))) redirect('/owner/sign-in')
  const directionId = requestedDirectionId(formData)
  const destination = await destinationPath(formData)
  ;(await cookies()).set(readerLabCookieName, directionId, readerLabCookieOptions())
  redirect(destination)
}

/** Switches to another direction and shows the current page again in it. */
export async function switchReaderDirection(formData: FormData): Promise<void> {
  const requestHeaders = await sameOriginHeaders()
  const cookieStore = await cookies()
  if (!(await hasOwnerSession(requestHeaders))) {
    // The owner session has ended, so the override can no longer show. Close the lab instead.
    cookieStore.delete(readerLabCookieName)
    return
  }
  cookieStore.set(readerLabCookieName, requestedDirectionId(formData), readerLabCookieOptions())
}

/** Leaves the Reader Lab: the current page shows again in the default direction. */
export async function exitReaderLab(): Promise<void> {
  await sameOriginHeaders()
  ;(await cookies()).delete(readerLabCookieName)
}
