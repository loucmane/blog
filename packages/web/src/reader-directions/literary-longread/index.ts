import { defineReaderDirection } from '../contract'
import { LiteraryArticle } from './article'
import { LiteraryAuthor } from './author'
import { fonts } from './fonts'
import { LiteraryHome } from './home'
import { LiterarySection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'
import { LiteraryTopic } from './topic'

export const literaryLongreadDirection = defineReaderDirection({
  Article: LiteraryArticle,
  Author: LiteraryAuthor,
  fonts,
  Home: LiteraryHome,
  id: 'literary-longread',
  imageSizes: {
    body: '(min-width: 768px) 42rem, (min-width: 712px) 42rem, calc(100vw - 2.5rem)',
    // The kit has one gallery hint for every layout. Keep vertical galleries sharp;
    // grid/diptych and nested media overfetch is a documented b3 shared-kit handoff.
    gallery: '(min-width: 768px) 42rem, (min-width: 712px) 42rem, calc(100vw - 2.5rem)',
  },
  name: 'Literary Long-read',
  Section: LiterarySection,
  styles,
  thesis: 'Words are the luxury: a bold illustrated cover and warm, unhurried reading.',
  tokens,
  Topic: LiteraryTopic,
})
