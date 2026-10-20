import type { ReaderFailureView } from '@/reader-directions/contract'

// The site name lives here, not in site-header-frame.tsx, so the eager error and not-found
// graphs that read it do not pull in next/link (blog-0044.55).
export const siteName = 'Magazine Foundation'

/** No content-store read: failure pages must remain usable when stories cannot be loaded. */
export const readerFailureView: ReaderFailureView = {
  navigation: { sections: [] },
  siteName,
}
