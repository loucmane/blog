import { connection } from 'next/server'

import { loadHomeView } from '@/reader/cache'
import { ReaderUnavailable } from '@/reader/components/reader-unavailable'
import { resolveReaderPresentation } from '@/reader-lab/presentation'
import { ReaderPage } from '@/reader-lab/reader-page'

export default async function HomePage() {
  await connection()
  const result = await loadHomeView()
  const presentation = await resolveReaderPresentation()
  const { Home } = presentation.direction

  return (
    <ReaderPage
      cacheGeneration={result.status === 'ready' ? result.cacheGeneration : undefined}
      presentation={presentation}
    >
      {result.status === 'ready' ? <Home view={result.view} /> : <ReaderUnavailable />}
    </ReaderPage>
  )
}
