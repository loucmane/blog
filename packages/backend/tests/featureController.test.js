import { describe, expect, it, vi } from 'vitest'

import { getFeatureById, getFeatures } from '../src/controllers/featureController.js'

function createResponse() {
  return {
    body: undefined,
    statusCode: 200,
    json: vi.fn(function json(body) {
      this.body = body
      return this
    }),
    status: vi.fn(function status(code) {
      this.statusCode = code
      return this
    }),
  }
}

describe('feature controllers', () => {
  it('runs under the server Node environment', () => {
    expect(typeof document).toBe('undefined')
  })

  it('returns the complete feature collection', () => {
    const response = createResponse()

    getFeatures({ query: {} }, response)

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveLength(3)
    expect(response.body.map((feature) => feature.id)).toEqual([1, 2, 3])
  })

  it('filters features without case sensitivity', () => {
    const response = createResponse()

    getFeatures({ query: { category: 'FRONTEND' } }, response)

    expect(response.body).toEqual([expect.objectContaining({ category: 'frontend', id: 1 })])
  })

  it('returns a feature by numeric route identifier', () => {
    const response = createResponse()

    getFeatureById({ params: { id: '2' } }, response)

    expect(response.body).toEqual(expect.objectContaining({ id: 2, name: 'Monorepo Architecture' }))
  })

  it('returns a 404 response for an unknown feature', () => {
    const response = createResponse()

    getFeatureById({ params: { id: '999' } }, response)

    expect(response.status).toHaveBeenCalledWith(404)
    expect(response.body).toEqual({ error: 'Feature not found' })
  })
})
