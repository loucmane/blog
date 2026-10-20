import type { AuthorDirectionProps } from '../contract'
import { SwissIndexList, SwissLabelRow } from './index-row'
import { SwissEmptyList, SwissPageHeader } from './listing'
import { SwissShell } from './shell'

/** An author's page is a bibliography: every story as an index row, without plates or images. */
export function SwissAuthor({ view }: AuthorDirectionProps) {
  return (
    <SwissShell navigation={view.navigation}>
      <SwissPageHeader count={view.stories.length} label="Author" name={view.name}>
        {view.bio ? <p className="si-dek si-bio">{view.bio}</p> : null}
      </SwissPageHeader>
      {view.stories.length ? (
        <section className="si-stories" aria-labelledby="si-stories">
          <SwissLabelRow count={view.stories.length} heading id="si-stories" label="Stories" />
          <SwissIndexList start={1} stories={view.stories} />
        </section>
      ) : (
        <SwissEmptyList>{`No published stories by ${view.name} yet.`}</SwissEmptyList>
      )}
    </SwissShell>
  )
}
