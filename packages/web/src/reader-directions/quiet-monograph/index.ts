import { defineReaderDirection } from '../contract'
import { MonographArticle } from './article'
import { fonts } from './fonts'
import { MonographHome } from './home'
import { MonographSection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'

export const quietMonographDirection = defineReaderDirection({
  Article: MonographArticle,
  fonts,
  Home: MonographHome,
  id: 'quiet-monograph',
  name: 'Quiet Monograph',
  Section: MonographSection,
  styles,
  thesis:
    'A gallery catalogue on paper: generous space, quiet serif titles, and one story at a time.',
  tokens,
})
