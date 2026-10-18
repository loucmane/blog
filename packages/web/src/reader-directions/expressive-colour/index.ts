import { defineReaderDirection } from '../contract'
import { ExpressiveArticle } from './article'
import { fonts } from './fonts'
import { ExpressiveHome } from './home'
import { ExpressiveSection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'

export const expressiveColourDirection = defineReaderDirection({
  id: 'expressive-colour',
  name: 'Expressive Colour',
  thesis: 'Soft serif letters, saturated story colours, and a little play on paper.',
  Home: ExpressiveHome,
  Article: ExpressiveArticle,
  Section: ExpressiveSection,
  fonts,
  tokens,
  styles,
})
