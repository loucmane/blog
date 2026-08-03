import type { DesignLabStory } from './types'

export function createDesignLabStory(): DesignLabStory {
  return {
    body: [
      'At four in the afternoon, the room begins to hold the sky.',
      'There is a particular kind of light that belongs to northern winters: low, lateral, and almost architectural. It does not simply enter a room. It redraws it.',
      'The architect describes this as a material rather than a condition—something to shape, reflect, and preserve.',
    ].join('\n\n'),
    dek: 'How northern rooms turn a brief season into an atmosphere.',
    image: '/design-lab/winter-room.svg',
    imageAlt: 'A quiet Nordic interior opening onto snow-covered trees',
    saved: 'Preview story · not yet protected',
    section: 'Design',
    server: null,
    status: 'draft',
    title: 'The quiet architecture of winter light',
  }
}
