import type { ReaderFailureView } from '@/reader-directions/contract'

import { siteName } from './site-header-frame'

/** No content-store read: failure pages must remain usable when stories cannot be loaded. */
export const readerFailureView: ReaderFailureView = {
  navigation: { sections: [] },
  siteName,
}
