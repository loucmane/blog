import { baselineDirection } from './baseline'
import { createReaderDirectionRegistry } from './contract'
import { literaryLongreadDirection } from './literary-longread'
import { quietMonographDirection } from './quiet-monograph'

/**
 * The reader directions, in Reader Lab order. To add one, import it and add it to `directions`;
 * the contract checks it when this module loads. Every visitor sees the default direction.
 */
export const readerDirections = createReaderDirectionRegistry({
  defaultId: baselineDirection.id,
  directions: [baselineDirection, quietMonographDirection, literaryLongreadDirection],
})
