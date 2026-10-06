import { defineReaderDirection } from '../contract'
import { BaselineArticle } from './article'
import { BaselineHome } from './home'
import { BaselineSection } from './section'

/** The plain, tidy R2 reader presentation, and the direction every visitor sees. */
export const baselineDirection = defineReaderDirection({
  Article: BaselineArticle,
  Home: BaselineHome,
  id: 'baseline',
  name: 'Baseline',
  Section: BaselineSection,
  thesis: 'The plain reader design: clear type, a quiet layout, and nothing in the way.',
})
