import type { ReaderDirection } from '@/reader-directions/contract'
import { ReaderPage } from './reader-page'
import type { ComparePageView } from './compare-data'

/** One loaded view is shared by every direction. No independent per-frame content reads. */
export function CompareView({
  direction,
  page,
}: {
  readonly direction: ReaderDirection
  readonly page: ComparePageView
}) {
  let content
  switch (page.kind) {
    case 'home':
      content = <direction.Home view={page.view} />
      break
    case 'story':
      content = <direction.Article view={page.view} />
      break
    case 'section':
      content = <direction.Section view={page.view} />
      break
    case 'author':
      content = <direction.Author view={page.view} />
      break
    case 'topic':
      content = <direction.Topic view={page.view} />
      break
  }
  return <ReaderPage presentation={{ direction, lab: null }}>{content}</ReaderPage>
}
