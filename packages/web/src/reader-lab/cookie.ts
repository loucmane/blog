import { resolveRuntimeSiteUrl } from '@/lib/site-url'

/**
 * The cookie that holds the direction the owner chose in the Reader Lab. On its own it changes
 * nothing: reader pages honor it only together with a valid owner session.
 */
export const readerLabCookieName = 'reader_lab_direction'

const readerLabCookieMaxAgeSeconds = 60 * 60 * 24 * 7

export function readerLabCookieOptions() {
  return {
    httpOnly: true,
    maxAge: readerLabCookieMaxAgeSeconds,
    path: '/',
    sameSite: 'lax' as const,
    secure: resolveRuntimeSiteUrl().protocol === 'https:',
  }
}
