import type { AuthorDirectionProps } from '../contract'
import { CinematicCollection } from './collection'

export function CinematicAuthor({ view }: AuthorDirectionProps) {
  return <CinematicCollection {...view} kind="author" description={view.bio} />
}
