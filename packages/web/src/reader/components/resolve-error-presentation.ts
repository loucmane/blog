'use server'

import { resolveReaderPresentation } from '@/reader-lab/presentation'

/**
 * The root client error boundary has no ReaderPage ancestor. Resolve its direction with the same
 * owner authorization as a normal page, and return only serializable presentation identifiers.
 * No input, mutation, content-store access, session details, or error details cross this action.
 */
export async function resolveErrorPresentation(): Promise<{ directionId: string; lab: boolean }> {
  const { direction, lab } = await resolveReaderPresentation()
  return { directionId: direction.id, lab: lab !== null }
}
