import { defineReaderDirection } from '../contract'
import { LiteraryArticle } from './article'
import { fonts } from './fonts'
import { LiteraryHome } from './home'
import { LiterarySection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'

export const literaryLongreadDirection = defineReaderDirection({
  Article: LiteraryArticle,
  fonts,
  Home: LiteraryHome,
  id: 'literary-longread',
  name: 'Literary Long-read',
  Section: LiterarySection,
  styles,
  thesis: 'Words are the luxury: a bold illustrated cover and warm, unhurried reading.',
  tokens,
})
