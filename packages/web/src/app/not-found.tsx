import { readerFailureView } from '@/reader/components/failure-view'
import { resolveReaderPresentation } from '@/reader-lab/presentation'
import { ReaderPage } from '@/reader-lab/reader-page'

export default async function NotFound() {
  const presentation = await resolveReaderPresentation()
  const { NotFound: View } = presentation.direction
  return (
    <ReaderPage presentation={presentation}>
      <View view={readerFailureView} />
    </ReaderPage>
  )
}
