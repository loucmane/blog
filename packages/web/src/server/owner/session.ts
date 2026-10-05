import { createHmac } from 'node:crypto'
import { headers as nextHeaders } from 'next/headers'

import { secureTokenMatches } from '@/lib/request-security'

import {
  resolveOwnerAuthConfiguration,
  resolveOwnerFixtureConfiguration,
  type OwnerEnvironment,
} from './config'
import { getOwnerAuth } from './auth'

export const ownerFixtureCookieName = 'magazine-owner-test-session'

export interface OwnerSession {
  readonly email: string
  readonly id: string
  readonly name: string
}

export class OwnerAccessError extends Error {
  constructor() {
    super('Sign in to continue to the owner workspace.')
    this.name = 'OwnerAccessError'
  }
}

function cookieValue(headers: Headers, name: string): string | null {
  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return null
  for (const entry of cookieHeader.split(';')) {
    const [candidate, ...value] = entry.trim().split('=')
    if (candidate === name) return decodeURIComponent(value.join('='))
  }
  return null
}

function fixtureSignature(token: string, email: string): string {
  return createHmac('sha256', token).update(`owner-test-session:v1:${email}`).digest('base64url')
}

export function createOwnerFixtureSession(environment: OwnerEnvironment = process.env): string {
  const fixture = resolveOwnerFixtureConfiguration(environment)
  if (!fixture) throw new OwnerAccessError()
  return `v1.${fixtureSignature(fixture.token, fixture.ownerEmail)}`
}

function fixtureSession(headers: Headers, environment: OwnerEnvironment): OwnerSession | null {
  const fixture = resolveOwnerFixtureConfiguration(environment)
  if (!fixture) return null
  const value = cookieValue(headers, ownerFixtureCookieName)
  const [version, signature, ...extra] = value?.split('.') ?? []
  if (
    version !== 'v1' ||
    !signature ||
    extra.length > 0 ||
    !secureTokenMatches(signature, fixtureSignature(fixture.token, fixture.ownerEmail))
  ) {
    return null
  }
  return { email: fixture.ownerEmail, id: 'owner-test-fixture', name: fixture.ownerName }
}

export async function resolveOwnerSession(
  headers: Headers,
  environment: OwnerEnvironment = process.env,
): Promise<OwnerSession | null> {
  const fixture = resolveOwnerFixtureConfiguration(environment)
  if (fixture) return fixtureSession(headers, environment)
  const configuration = resolveOwnerAuthConfiguration(environment)
  const session = await getOwnerAuth().api.getSession({ headers })
  if (!session || session.user.email.toLowerCase() !== configuration.ownerEmail) return null
  return { email: session.user.email, id: session.user.id, name: session.user.name }
}

export async function requireOwnerSession(
  headers: Headers,
  environment: OwnerEnvironment = process.env,
): Promise<OwnerSession> {
  const session = await resolveOwnerSession(headers, environment)
  if (!session) throw new OwnerAccessError()
  return session
}

export async function requireOwnerPageSession(): Promise<OwnerSession> {
  return requireOwnerSession(new Headers(await nextHeaders()))
}
