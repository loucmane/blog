import { defineReaderDirection } from '../contract'
import { BaselineArticle } from './article'
import { BaselineAuthor } from './author'
import { BaselineHome } from './home'
import { BaselineSection } from './section'
import { BaselineTopic } from './topic'

/** The plain, tidy R2 reader presentation, and the direction every visitor sees. */
export const baselineDirection = defineReaderDirection({
  Article: BaselineArticle,
  Author: BaselineAuthor,
  Home: BaselineHome,
  id: 'baseline',
  name: 'Baseline',
  Section: BaselineSection,
  thesis: 'The plain reader design: clear type, a quiet layout, and nothing in the way.',
  Topic: BaselineTopic,
})
