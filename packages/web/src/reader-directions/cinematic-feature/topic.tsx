import type { TopicDirectionProps } from '../contract'
import { CinematicCollection } from './collection'

export function CinematicTopic({ view }: TopicDirectionProps) {
  return <CinematicCollection {...view} kind="topic" />
}
