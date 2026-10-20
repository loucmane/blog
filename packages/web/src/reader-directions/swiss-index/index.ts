import { defineReaderDirection } from '../contract'
import { articleImageSizes, SwissArticle } from './article'
import { SwissAuthor } from './author'
import { fonts } from './fonts'
import { SwissHome } from './home'
import { SwissSection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'
import { SwissTopic } from './topic'

export const swissIndexDirection = defineReaderDirection({
  Article: SwissArticle,
  Author: SwissAuthor,
  fonts,
  Home: SwissHome,
  id: 'swiss-index',
  imageSizes: articleImageSizes,
  name: 'Swiss Index',
  Section: SwissSection,
  styles,
  thesis: 'A well-ordered index: bold grotesk type, precise rules and room for every story.',
  tokens,
  Topic: SwissTopic,
})
