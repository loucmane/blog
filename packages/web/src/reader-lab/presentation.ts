import { cookies, headers } from 'next/headers'

import type { ReaderDirection, ReaderDirectionNeighbours } from '@/reader-directions/contract'
import { readerDirections } from '@/reader-directions/registry'
import { resolveOwnerSession } from '@/server/owner/session'

import { readerLabCookieName } from './cookie'

export interface ReaderLabState extends ReaderDirectionNeighbours {
  readonly direction: ReaderDirection
}

export interface ReaderPresentation {
  readonly direction: ReaderDirection
  /** Set only for the signed-in owner who is viewing the site in a Reader Lab direction. */
  readonly lab: ReaderLabState | null
}

/**
 * Chooses the direction for a reader page. Visitors always get the default direction. The lab
 * cookie counts only when it names a registered direction and the request has an owner session;
 * every other case, including an unknown value or a session that cannot be checked, falls back to
 * the default.
 */
export async function resolveReaderPresentation(): Promise<ReaderPresentation> {
  const fallback = { direction: readerDirections.defaultDirection, lab: null }
  // Read the lab cookie with cookies(), not headers(): after a Server Action switches directions,
  // only cookies() shows the new value while the same response re-renders the page.
  const requested = readerDirections.find((await cookies()).get(readerLabCookieName)?.value)
  if (!requested) return fallback
  const owner = await resolveOwnerSession(new Headers(await headers())).catch(() => null)
  if (!owner) return fallback
  return {
    direction: requested,
    lab: { direction: requested, ...readerDirections.neighbours(requested.id) },
  }
}
