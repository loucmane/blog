import type { DesignLabDirection, DesignLabDirectionMetadata, DesignLabView } from './types'

const requiredViews = ['desk', 'write', 'reader'] as const satisfies readonly DesignLabView[]

function requireText(value: string, field: string): string {
  if (!value.trim()) throw new TypeError(`Design-lab ${field} must be a non-empty string`)
  return value.trim()
}

export function defineDesignLabDirection(input: DesignLabDirection): DesignLabDirection {
  if (!/^[a-z][a-z0-9-]*$/.test(input.id)) {
    throw new TypeError(`Design-lab id "${input.id}" must use lowercase kebab-case`)
  }
  for (const view of requiredViews) {
    if (typeof input.views[view] !== 'function') {
      throw new TypeError(`Design-lab direction "${input.id}" must provide a ${view} view`)
    }
  }
  const metadata = Object.fromEntries(
    Object.entries(input.metadata).map(([field, value]) => [field, requireText(value, field)]),
  ) as unknown as DesignLabDirectionMetadata
  return Object.freeze({
    ...input,
    metadata: Object.freeze(metadata),
    views: Object.freeze(input.views),
  })
}

export function createDesignLabRegistry(inputs: readonly DesignLabDirection[]) {
  const byId = new Map<string, DesignLabDirection>()
  for (const input of inputs) {
    const direction = defineDesignLabDirection(input)
    if (byId.has(direction.id)) throw new TypeError(`Duplicate design-lab id "${direction.id}"`)
    byId.set(direction.id, direction)
  }
  if (byId.size === 0) throw new TypeError('At least one design-lab direction is required')
  const list = Object.freeze([...byId.values()])
  return Object.freeze({
    first: () => list[0]!,
    get(id: string) {
      const direction = byId.get(id)
      if (!direction) throw new RangeError(`Unknown design-lab direction "${id}"`)
      return direction
    },
    has: (id: string) => byId.has(id),
    list: () => list,
  })
}

export const designLabContract = Object.freeze({ requiredViews })
