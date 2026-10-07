import { defineReaderDirection } from '../contract'
import { SwissArticle } from './article'
import { fonts } from './fonts'
import { SwissHome } from './home'
import { SwissSection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'

export const swissIndexDirection = defineReaderDirection({
  Article: SwissArticle,
  fonts,
  Home: SwissHome,
  id: 'swiss-index',
  name: 'Swiss Index',
  Section: SwissSection,
  styles,
  thesis: 'A well-ordered index: bold grotesk type, precise rules and room for every story.',
  tokens,
})
