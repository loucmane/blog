'use server'

import { redirect } from 'next/navigation'

import { readerDirections } from '@/reader-directions/registry'
import { requireOwnerPageSession } from '@/server/owner/session'

import { switchReaderDirection } from './actions'
import { loadComparePage } from './compare-data'

/** Change only the owner's existing lab-view cookie, then open the exact published page. */
export async function openComparedDirection(formData: FormData): Promise<void> {
  await requireOwnerPageSession()
  const id = formData.get('direction')
  if (typeof id !== 'string' || !readerDirections.find(id))
    throw new Error('Choose a registered direction.')
  const selected = await loadComparePage(formData.get('page'))
  if (selected.status !== 'ready')
    throw new Error(
      'This published page is no longer available. Return to the comparison and choose another page.',
    )
  // Reuses the lab's origin check, owner check and cookie policy.
  await switchReaderDirection(formData)
  redirect(selected.path)
}
