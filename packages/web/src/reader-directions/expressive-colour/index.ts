import { defineReaderDirection } from '../contract'
import { ExpressiveArticle } from './article'
import { ExpressiveAuthor } from './author'
import { ExpressiveError, ExpressiveNotFound, ExpressiveUnavailable } from './failure'
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
  NotFound: ExpressiveNotFound,
  Error: ExpressiveError,
  Unavailable: ExpressiveUnavailable,
  imageSizes: bodyImageSizes,
  fonts,
  tokens,
  styles,
})
