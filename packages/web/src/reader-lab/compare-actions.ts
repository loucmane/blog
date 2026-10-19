'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { requestOriginMatches } from '@/lib/request-security'
import { resolveRuntimeSiteUrl } from '@/lib/site-url'
import { readerDirections } from '@/reader-directions/registry'
import { OwnerAccessError, resolveOwnerSession } from '@/server/owner/session'

import { switchReaderDirection } from './actions'
import { loadComparePage } from './compare-data'

/** Change only the owner's existing lab-view cookie, then open the exact published page. */
export async function openComparedDirection(formData: FormData): Promise<void> {
  // Same order as the other lab actions: same-origin first, then the owner session, then any read.
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
  if ((await resolveOwnerSession(requestHeaders).catch(() => null)) === null)
    redirect('/owner/sign-in')
  const id = formData.get('direction')
  if (typeof id !== 'string' || !readerDirections.find(id))
    throw new Error('Choose a registered direction.')
  const selected = await loadComparePage(formData.get('page'))
  if (selected.status !== 'ready')
    throw new Error(
      'This published page is no longer available. Return to the comparison and choose another page.',
    )
  // Reuses the lab's cookie policy (it checks origin and owner again).
  await switchReaderDirection(formData)
  redirect(selected.path)
}
