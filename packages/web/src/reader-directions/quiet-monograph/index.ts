import { defineReaderDirection } from '../contract'
import { MonographArticle } from './article'
import { MonographAuthor } from './author'
import { bodyImageSizes } from './fit'
import { fonts } from './fonts'
import { MonographHome } from './home'
import { MonographSection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'
import { MonographTopic } from './topic'

export const quietMonographDirection = defineReaderDirection({
  Article: MonographArticle,
  Author: MonographAuthor,
  fonts,
  Home: MonographHome,
  id: 'quiet-monograph',
  imageSizes: bodyImageSizes,
  name: 'Quiet Monograph',
  Section: MonographSection,
  styles,
  thesis:
    'A gallery catalogue on paper: generous space, quiet serif titles, and one story at a time.',
  tokens,
  Topic: MonographTopic,
})
