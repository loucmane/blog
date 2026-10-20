import { defineReaderDirection } from '../contract'
import { CinematicArticle } from './article'
import { CinematicAuthor } from './author'
import { CinematicError, CinematicNotFound, CinematicUnavailable } from './failure'
import { fonts } from './fonts'
import { CinematicHome } from './home'
import { CinematicSection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'
import { CinematicTopic } from './topic'

export const cinematicFeatureDirection = defineReaderDirection({
  Article: CinematicArticle,
  Author: CinematicAuthor,
  Error: CinematicError,
  fonts,
  Home: CinematicHome,
  id: 'cinematic-feature',
  imageSizes: {
    body: '(min-width: 768px) 42rem, 100vw',
    gallery: '(min-width: 768px) 42rem, 100vw',
  },
  name: 'Cinematic Feature',
  NotFound: CinematicNotFound,
  Section: CinematicSection,
  styles,
  thesis: 'Stories staged like film stills: expansive images, condensed titles and room to read.',
  tokens,
  Topic: CinematicTopic,
  Unavailable: CinematicUnavailable,
})
