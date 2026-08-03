import { archiveDesignLabDirections } from './archive-registry'
import { createDesignLabRegistry, defineDesignLabDirection } from './contract'
import { ContactDesk, ContactReader, ContactWrite } from './directions/contact'
import { FolioDesk, FolioReader, FolioWrite } from './directions/folio'
import { HaloDesk, HaloReader, HaloWrite } from './directions/halo'

export const designLabRegistry = createDesignLabRegistry([
  defineDesignLabDirection({
    id: 'folio',
    metadata: {
      character: 'Porcelain, graphite, clear cobalt, and quiet chrome.',
      collection: 'Round 4 · Finalists',
      name: 'Folio',
      order: 'D1',
      ownerFit: 'The calmest option: important actions stay obvious while the interface recedes.',
      risk: 'Its restraint requires excellent typography and photography.',
      signature: 'A cobalt folio edge follows the story from desk to public reading.',
      thesis: 'A precision editorial atelier where every story behaves like a handled object.',
    },
    views: { desk: FolioDesk, reader: FolioReader, write: FolioWrite },
  }),
  defineDesignLabDirection({
    id: 'contact',
    metadata: {
      character: 'Cool aluminium, milk glass, oxblood, and powder rose.',
      collection: 'Round 4 · Finalists',
      name: 'Contact',
      order: 'D2',
      ownerFit: 'Best when photography drives the magazine and image decisions stay visible.',
      risk: 'Its expressive production language needs strong simplicity guardrails.',
      signature: 'A living contact sheet shows the issue as one visual sequence.',
      thesis:
        'An image-led production room informed by fashion lookbooks and art direction tables.',
    },
    views: { desk: ContactDesk, reader: ContactReader, write: ContactWrite },
  }),
  defineDesignLabDirection({
    id: 'halo',
    metadata: {
      character: 'Midnight indigo, mineral blue, pearl, and spectral lilac.',
      collection: 'Round 4 · Finalists',
      name: 'Halo',
      order: 'D3',
      ownerFit: 'The clearest sense of momentum and publication readiness.',
      risk: 'Its atmosphere requires disciplined accessibility and reduced motion.',
      signature: 'A luminous halo changes state as a story moves toward release.',
      thesis: 'A spatial publishing instrument that makes readiness and release timing ambient.',
    },
    views: { desk: HaloDesk, reader: HaloReader, write: HaloWrite },
  }),
  ...archiveDesignLabDirections,
])
