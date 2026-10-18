import { defineReaderDirection } from '../contract'
import { CinematicArticle } from './article'
import { fonts } from './fonts'
import { CinematicHome } from './home'
import { CinematicSection } from './section'
import { styles } from './styles'
import { tokens } from './tokens'

export const cinematicFeatureDirection = defineReaderDirection({
  Article: CinematicArticle,
  fonts,
  Home: CinematicHome,
  id: 'cinematic-feature',
  name: 'Cinematic Feature',
  Section: CinematicSection,
  styles,
  thesis: 'Stories staged like film stills: expansive images, condensed titles and room to read.',
  tokens,
})
