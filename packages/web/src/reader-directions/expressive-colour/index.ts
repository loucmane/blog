import { defineReaderDirection } from '../contract'
import { ExpressiveArticle } from './article'
import { ExpressiveAuthor } from './author'
import { fonts } from './fonts'
import { ExpressiveHome } from './home'
import { ExpressiveSection } from './section'
import { bodyImageSizes } from './sizes'
import { styles } from './styles'
import { tokens } from './tokens'
import { ExpressiveTopic } from './topic'

export const expressiveColourDirection = defineReaderDirection({
  id: 'expressive-colour',
  name: 'Expressive Colour',
  thesis: 'Soft serif letters, saturated story colours, and a little play on paper.',
  Home: ExpressiveHome,
  Article: ExpressiveArticle,
  Section: ExpressiveSection,
  Author: ExpressiveAuthor,
  Topic: ExpressiveTopic,
  imageSizes: bodyImageSizes,
  fonts,
  tokens,
  styles,
})
