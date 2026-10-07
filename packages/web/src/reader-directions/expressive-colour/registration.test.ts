import { expect, it } from 'vitest'

import { readerDirections } from '../registry'

it('registers a complete Expressive Colour presentation while baseline remains public', () => {
  const direction = readerDirections.find('expressive-colour')
  expect(direction?.name).toBe('Expressive Colour')
  expect(direction?.Home).toBeTypeOf('function')
  expect(direction?.Article).toBeTypeOf('function')
  expect(direction?.Section).toBeTypeOf('function')
  expect(readerDirections.defaultDirection.id).toBe('baseline')
})
