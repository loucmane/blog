import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process'
import { createHash, createHmac, pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { Duplex, PassThrough } from 'node:stream'

import { Client, Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'

import { backupRun } from './operation-runs'
import { recordOperationRun } from './record-operation-run'
import {
  ChannelBindingClient,
  ChannelBindingError,
  drillPool,
  drillPoolConfig,
  runPostgresTool,
} from './restore-drill-postgres'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))

function processFixture() {
  const child = Object.assign(new EventEmitter(), {
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    kill: vi.fn(),
  })
  const mockSpawn = vi.mocked(spawn).mockReturnValue(child as unknown as ChildProcess)
  return { child, spawn: mockSpawn }
}

describe('restore drill PostgreSQL subprocess boundary', () => {
  it('passes a bounded archive on stdin with credentials only in an isolated child environment', async () => {
    const { child, spawn } = processFixture()
    const password = randomUUID()
    const url = new URL('postgresql://drill@127.0.0.1:25442/restore_drill_target_fixture')
    url.password = password
    const input = Buffer.from('synthetic custom archive')
    const received: Buffer[] = []
    child.stdin.on('data', (chunk: Buffer) => received.push(chunk))
    const args = ['--exit-on-error', '--dbname', 'restore_drill_target_fixture']
    const result = runPostgresTool('pg_restore', args, url.href, input)
    child.emit('close', 0)
    await expect(result).resolves.toEqual(Buffer.alloc(0))
    expect(Buffer.concat(received)).toEqual(input)
    const invocation = spawn.mock.calls[0]!
    expect(invocation.slice(0, 2)).toEqual(['pg_restore', args])
    const options = invocation[2] as SpawnOptions
    expect(options).toMatchObject({ stdio: ['pipe', 'pipe', 'ignore'], timeout: 900_000 })
    expect(options.shell).toBeUndefined()
    expect(options.env).toEqual({
      PATH: process.env.PATH,
      LANG: 'C',
      PGHOST: '127.0.0.1',
      PGPORT: '25442',
      PGDATABASE: 'restore_drill_target_fixture',
      PGUSER: 'drill',
      PGPASSWORD: password,
      PGSSLMODE: 'disable',
      PGCONNECT_TIMEOUT: '10',
    })
    expect(JSON.stringify(args)).not.toContain(password)
  })

  it('hands a hosted URL’s verified TLS and channel binding to the PostgreSQL tools and node-postgres', async () => {
    const { child, spawn } = processFixture()
    const url = new URL(
      'postgresql://neondb_owner@ep-quiet-lake-a1b2c3d4.eu-central-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require',
    )
    url.password = randomUUID()
    const result = runPostgresTool('pg_dump', ['--format=custom'], url.href)
    child.emit('close', 0)
    await result
    expect((spawn.mock.calls[0]![2] as SpawnOptions).env).toMatchObject({
      PGHOST: 'ep-quiet-lake-a1b2c3d4.eu-central-1.aws.neon.tech',
      PGSSLMODE: 'verify-full',
      PGSSLROOTCERT: 'system',
      PGGSSENCMODE: 'disable',
      // libpq refuses a server that does not bind the channel; pg_dump keeps the URL's value.
      PGCHANNELBINDING: 'require',
    })

    // node-postgres binds whenever the server offers SCRAM-SHA-256-PLUS for `require` and
    // `prefer`; only `require` gets the client and the pool check that refuse anything else.
    const pools = ['require', 'prefer', 'disable', null].map((binding) => {
      const target = new URL(url)
      if (binding === null) target.searchParams.delete('channel_binding')
      else target.searchParams.set('channel_binding', binding)
      return drillPool(target.href)
    })
    const options = pools.map(
      (pool) => (pool as unknown as { options: Record<string, unknown> }).options,
    )
    expect(options.map(({ enableChannelBinding }) => enableChannelBinding)).toEqual([
      true,
      true,
      false,
      false,
    ])
    expect(options.map(({ Client }) => Client)).toEqual([
      ChannelBindingClient,
      undefined,
      undefined,
      undefined,
    ])
    expect(options.map(({ onConnect }) => typeof onConnect)).toEqual([
      'function',
      'undefined',
      'undefined',
      'undefined',
    ])
    for (const { ssl } of options) expect(ssl).toMatchObject({ rejectUnauthorized: true })
    await Promise.all(pools.map((pool) => pool.end()))
  })

  it('returns binary dump output without string conversion', async () => {
    const { child } = processFixture()
    const result = runPostgresTool('pg_dump', ['--format=custom'])
    const archive = Buffer.from([0, 255, 128, 1])
    child.stdout.write(archive)
    child.emit('close', 0)
    await expect(result).resolves.toEqual(archive)
  })

  it('returns fixed errors for spawn, input and exit failures without driver text', async () => {
    for (const failure of ['spawn', 'stdin', 'exit']) {
      const { child, spawn } = processFixture()
      const result = runPostgresTool('pg_dump', ['--format=custom'])
      const rejection = expect(result).rejects.toThrow(/^operation_failed$/)
      if (failure === 'spawn') child.emit('error', new Error(randomUUID()))
      else if (failure === 'stdin') child.stdin.emit('error', new Error(randomUUID()))
      else child.emit('close', 1)
      await rejection
      spawn.mockRestore()
    }
  })
})

const plus = 'SCRAM-SHA-256-PLUS'
const scram = 'SCRAM-SHA-256'

/**
 * The DER shape pg reads a peer certificate's signature hash from (lib/crypto/cert-signatures.js):
 * a certificate signed with sha256WithRSAEncryption, and nothing else in it.
 */
const peerCertificate = Buffer.from('300f3000300b06092a864886f70d01010b', 'hex')

function backendMessage(code: string, body: Buffer = Buffer.alloc(0)): Buffer {
  const header = Buffer.alloc(5)
  header.write(code, 0, 'latin1')
  header.writeUInt32BE(body.length + 4, 1)
  return Buffer.concat([header, body])
}

function authenticationRequest(kind: number, payload: Buffer = Buffer.alloc(0)): Buffer {
  const code = Buffer.alloc(4)
  code.writeUInt32BE(kind)
  return backendMessage('R', Buffer.concat([code, payload]))
}

/** AuthenticationOk and what PostgreSQL sends with it: key data, then ready for a query. */
const authenticated = Buffer.concat([
  authenticationRequest(0),
  backendMessage('K', Buffer.from([0, 0, 0, 1, 0, 0, 0, 2])),
  backendMessage('Z', Buffer.from('I')),
])

/** The answer to one INSERT through the extended protocol, sent once the client syncs. */
const inserted = Buffer.concat([
  backendMessage('1'),
  backendMessage('2'),
  backendMessage('n'),
  backendMessage('C', Buffer.from('INSERT 0 1\0')),
  backendMessage('Z', Buffer.from('I')),
])

function hmac(key: Buffer, text: string): Buffer {
  return createHmac('sha256', key).update(text).digest()
}

interface FakeServerOptions {
  /** The server's final SCRAM signature is wrong, as one that does not know the password's is. */
  readonly forgedSignature?: boolean
  /** The server sends AuthenticationOk without its final SCRAM message. */
  readonly skipFinal?: boolean
  /** Whether the stream presents `peerCertificate`, as a verified TLS socket presents its peer's. */
  readonly tls?: boolean
}

/**
 * A PostgreSQL server as node-postgres sees it across verified TLS, in process: the stream presents
 * `peerCertificate` as its peer's. It asks for `authentication` (SASL with these mechanisms, a
 * cleartext or MD5 password, or none at all) and runs SCRAM in full against `password`, checking
 * the client's channel binding and proof. `heard` lists what the client sent.
 */
function fakeServer(
  password: string,
  authentication: 'cleartext' | 'md5' | 'trust' | readonly string[],
  { forgedSignature = false, skipFinal = false, tls = true }: FakeServerOptions = {},
) {
  const heard: string[] = []
  const salt = randomBytes(16)
  const iterations = 4096
  let received = Buffer.alloc(0)
  let started = false
  let awaiting: 'password' | 'sasl-initial' | 'sasl-final' | null = null
  let exchange = { clientFirstBare: '', gs2Header: '', mechanism: '', serverFirst: '' }

  function nextMessage(): { readonly body: Buffer; readonly code: string } | null {
    // Only the startup message has no type byte.
    const header = started ? 5 : 4
    if (received.length < header) return null
    const end = (started ? 1 : 0) + received.readUInt32BE(started ? 1 : 0)
    if (received.length < end) return null
    const code = started ? String.fromCharCode(received[0]!) : 'startup'
    const body = received.subarray(header, end)
    received = received.subarray(end)
    started = true
    return { body, code }
  }

  function answer({ body, code }: { readonly body: Buffer; readonly code: string }) {
    if (code === 'startup') {
      heard.push('startup')
      if (authentication === 'trust') return authenticated
      if (authentication === 'cleartext' || authentication === 'md5') {
        awaiting = 'password'
        return authentication === 'md5'
          ? authenticationRequest(5, randomBytes(4))
          : authenticationRequest(3)
      }
      awaiting = 'sasl-initial'
      return authenticationRequest(10, Buffer.from(`${authentication.join('\0')}\0\0`))
    }
    if (code === 'X') {
      heard.push('terminate')
      return null
    }
    if (awaiting === null) {
      // Authenticated: a statement through the extended protocol, answered at Sync.
      if (code === 'P') {
        const nameEnd = body.indexOf(0)
        const text = body.subarray(nameEnd + 1, body.indexOf(0, nameEnd + 1)).toString()
        heard.push(`statement ${text.trim().split(/\s+/).slice(0, 3).join(' ')}`)
      }
      return code === 'S' ? inserted : null
    }
    if (code !== 'p') throw new Error(`Unexpected message ${code}.`)
    if (awaiting === 'password') {
      heard.push('password')
      awaiting = null
      return authenticated
    }
    if (awaiting === 'sasl-initial') {
      const end = body.indexOf(0)
      const mechanism = body.subarray(0, end).toString()
      const clientFirst = body.subarray(end + 5, end + 5 + body.readInt32BE(end + 1)).toString()
      const bare = clientFirst.indexOf(',', clientFirst.indexOf(',') + 1) + 1
      const clientFirstBare = clientFirst.slice(bare)
      const nonce = /(?:^|,)r=([^,]+)/.exec(clientFirstBare)?.[1] ?? ''
      const serverNonce = randomBytes(18).toString('base64')
      const serverFirst = `r=${nonce}${serverNonce},s=${salt.toString('base64')},i=${iterations}`
      exchange = { clientFirstBare, gs2Header: clientFirst.slice(0, bare), mechanism, serverFirst }
      heard.push(`sasl ${mechanism}`)
      awaiting = 'sasl-final'
      return authenticationRequest(11, Buffer.from(serverFirst))
    }
    // The client's final SCRAM message: its channel binding, then its proof.
    awaiting = null
    const clientFinal = body.toString()
    const proofAt = clientFinal.lastIndexOf(',p=')
    const withoutProof = clientFinal.slice(0, proofAt)
    const binding = Buffer.from(/^c=([^,]+)/.exec(withoutProof)?.[1] ?? '', 'base64')
    const certificateHash = createHash('sha256').update(peerCertificate).digest()
    const expectedBinding = Buffer.concat([
      Buffer.from(exchange.gs2Header),
      ...(exchange.mechanism === plus ? [certificateHash] : []),
    ])
    const authMessage = `${exchange.clientFirstBare},${exchange.serverFirst},${withoutProof}`
    const salted = pbkdf2Sync(password, salt, iterations, 32, 'sha256')
    const clientKey = hmac(salted, 'Client Key')
    const clientSignature = hmac(createHash('sha256').update(clientKey).digest(), authMessage)
    const proof = Buffer.from(clientKey.map((byte, index) => byte ^ clientSignature[index]!))
    const proven =
      binding.equals(expectedBinding) &&
      Buffer.from(clientFinal.slice(proofAt + 3), 'base64').equals(proof)
    heard.push(proven ? 'sasl proof' : 'sasl wrong proof')
    const signature = forgedSignature
      ? randomBytes(32)
      : hmac(hmac(salted, 'Server Key'), authMessage)
    const final = authenticationRequest(12, Buffer.from(`v=${signature.toString('base64')}`))
    return skipFinal ? authenticated : Buffer.concat([final, authenticated])
  }

  const stream = new Duplex({
    read() {},
    write(chunk: Buffer, _encoding, done) {
      received = Buffer.concat([received, chunk])
      for (let message = nextMessage(); message !== null; message = nextMessage()) {
        const reply = answer(message)
        if (reply !== null) stream.push(reply)
      }
      done()
    },
    final(done) {
      stream.push(null)
      done()
    },
  })
  // What node-postgres calls on its socket; a TLS socket also presents its peer's certificate.
  Object.assign(stream, {
    connect: () => process.nextTick(() => stream.emit('connect')),
    ref: () => undefined,
    setKeepAlive: () => undefined,
    setNoDelay: () => undefined,
    unref: () => undefined,
    ...(tls ? { getPeerCertificate: () => ({ raw: peerCertificate }) } : {}),
  })
  return { heard, stream }
}

describe('node-postgres channel binding', () => {
  /** A hosted URL as backupDatabaseUrl leaves it, with its password built at run time. */
  function hosted(binding: 'prefer' | 'require') {
    const url = new URL(
      'postgresql://neondb_owner@ep-quiet-lake-a1b2c3d4.eu-central-1.aws.neon.tech/neondb',
    )
    url.password = randomBytes(12).toString('base64url')
    url.search = `sslmode=verify-full&channel_binding=${binding}`
    return { host: url.hostname, password: url.password, url: url.href }
  }

  /**
   * One connection through the pool drillPool configures for `binding`, to `server` in process
   * instead of the network: the server's stream stands in for the verified TLS socket, so the
   * pool's own TLS settings are left out. It reports what the pool handed out.
   */
  async function connectTo(
    binding: 'prefer' | 'require',
    authentication: Parameters<typeof fakeServer>[1],
    options?: FakeServerOptions,
  ) {
    const { host, password, url } = hosted(binding)
    const server = fakeServer(password, authentication, options)
    const pool = new Pool({ ...drillPoolConfig(url), ssl: false, stream: () => server.stream })
    // drillPool's own listener, which keeps driver text off stderr.
    pool.on('error', () => undefined)
    const handedOut: unknown[] = []
    pool.on('connect', (client) => handedOut.push(client))
    let client: unknown
    try {
      const connected = await pool.connect()
      client = connected
      connected.release()
    } catch (error) {
      client = error
    }
    await pool.end()
    return { client, handedOut, heard: server.heard, host, password, stream: server.stream }
  }

  function expectRefused(result: Awaited<ReturnType<typeof connectTo>>) {
    expect(result.client).toBeInstanceOf(ChannelBindingError)
    const { message, name } = result.client as Error
    expect([name, message]).toEqual(['ChannelBindingError', new ChannelBindingError().message])
    expect(message).not.toMatch(new RegExp(`${result.host}|${result.password}|SASL|ECONN`))
    // The pool handed nothing out, and the socket is closed.
    expect(result.handedOut).toEqual([])
    expect(result.stream.destroyed).toBe(true)
  }

  it('accepts SCRAM-SHA-256-PLUS over verified TLS when the URL requires channel binding', async () => {
    const result = await connectTo('require', [plus, scram])

    expect(result.client).toBeInstanceOf(ChannelBindingClient)
    expect(result.handedOut).toEqual([result.client])
    // The client chose the bound mechanism and bound it to this certificate.
    expect(result.heard).toEqual(['startup', `sasl ${plus}`, 'sasl proof', 'terminate'])
  })

  it('refuses a server that offers only plain SCRAM-SHA-256 under require, and binds where it can under prefer', async () => {
    const required = await connectTo('require', [scram])
    const preferred = await connectTo('prefer', [scram])
    const preferredPlus = await connectTo('prefer', [plus, scram])

    expectRefused(required)
    // No SASL answer was sent: the client never took part in the exchange.
    expect(required.heard).toEqual(['startup'])
    expect(preferred.client).toBeInstanceOf(Client)
    expect(preferred.client).not.toBeInstanceOf(ChannelBindingClient)
    expect(preferred.heard).toEqual(['startup', `sasl ${scram}`, 'sasl proof', 'terminate'])
    expect(preferredPlus.heard).toEqual(['startup', `sasl ${plus}`, 'sasl proof', 'terminate'])
  })

  it('refuses a cleartext or MD5 password request, or no authentication, without sending a password', async () => {
    for (const authentication of ['cleartext', 'md5', 'trust'] as const) {
      const result = await connectTo('require', authentication)

      expectRefused(result)
      expect(result.heard).toEqual(['startup'])
    }
  })

  it('refuses a bound exchange the server does not finish, and the bound mechanism without TLS', async () => {
    const unfinished = await connectTo('require', [plus, scram], { skipFinal: true })
    const plaintext = await connectTo('require', [plus, scram], { tls: false })
    const forged = await connectTo('require', [plus, scram], { forgedSignature: true })

    expectRefused(unfinished)
    expect(unfinished.heard).toEqual(['startup', `sasl ${plus}`, 'sasl proof'])
    expectRefused(plaintext)
    expect(plaintext.heard).toEqual(['startup'])
    // pg refuses a forged signature itself; the guard still lets nothing after it through.
    expect(forged.client).toBeInstanceOf(Error)
    expect([forged.handedOut, forged.stream.destroyed]).toEqual([[], true])
  })

  it('records a run only over a connection that bound, when DATABASE_URL requires channel binding', async () => {
    const { password, url } = hosted('require')
    const run = backupRun(new Date(Date.now() - 600_000), new Date(), null)
    // The recorder's own drillPool connection, to `server` instead of the network.
    const through = (server: ReturnType<typeof fakeServer>) => (databaseUrl: string) => {
      const pool = new Pool({
        ...drillPoolConfig(databaseUrl),
        ssl: false,
        stream: () => server.stream,
      })
      pool.on('error', () => undefined)
      return pool
    }

    const unbound = fakeServer(password, [scram])
    await expect(
      recordOperationRun({ DATABASE_URL: url }, run, through(unbound)),
    ).rejects.toMatchObject({ code: 'operation_failed', message: 'operation_failed' })
    expect(unbound.heard).toEqual(['startup'])

    const bound = fakeServer(password, [plus, scram])
    await recordOperationRun({ DATABASE_URL: url }, run, through(bound))
    expect(bound.heard).toEqual([
      'startup',
      `sasl ${plus}`,
      'sasl proof',
      'statement INSERT INTO operation_runs',
      'terminate',
    ])
  })

  it('passes nothing the server sends after a refusal on to the client', async () => {
    const { password, url } = hosted('require')
    const server = fakeServer(password, 'trust')
    const client = new ChannelBindingClient({
      ...drillPoolConfig(url),
      ssl: false,
      stream: () => server.stream,
    })
    const connected = vi.fn()
    // pg emits `connect` once the client is ready; @types/pg does not list that event.
    ;(client as EventEmitter).on('connect', connected)

    await expect(client.connect()).rejects.toBeInstanceOf(ChannelBindingError)
    // The key data and ReadyForQuery came in the same packet as AuthenticationOk.
    expect((client as unknown as { processID: unknown }).processID).toBeNull()
    expect(connected).not.toHaveBeenCalled()
    expect(server.stream.destroyed).toBe(true)
  })

  it('reads pg internals that still have the shape requireChannelBinding relies on', async () => {
    // These are pg 8.22's. If this fails after a pg upgrade, revisit requireChannelBinding first.
    const { password, url } = hosted('require')
    const server = fakeServer(password, [plus, scram])
    const client = new Client({ ...drillPoolConfig(url), ssl: false, stream: () => server.stream })
    const internals = client as unknown as {
      readonly connection: EventEmitter & { readonly stream: unknown }
      readonly saslSession?: { readonly mechanism?: unknown } | null
    }
    const seen: (readonly [string, unknown])[] = []
    for (const event of [
      'authenticationSASL',
      'authenticationSASLContinue',
      'authenticationSASLFinal',
      'authenticationOk',
    ]) {
      internals.connection.on(event, () =>
        seen.push([event, internals.saslSession && internals.saslSession.mechanism]),
      )
    }

    await client.connect()
    await client.end()

    // Each backend message reaches the connection's listeners, under its pg-protocol name,
    // before the client's own handlers; the session names its mechanism until the server's final
    // signature has been checked, and is cleared after.
    expect(internals.connection.stream).toBe(server.stream)
    expect(seen).toEqual([
      ['authenticationSASL', undefined],
      ['authenticationSASLContinue', plus],
      ['authenticationSASLFinal', plus],
      ['authenticationOk', null],
    ])
  })
})
