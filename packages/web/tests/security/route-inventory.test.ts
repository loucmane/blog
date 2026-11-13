import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { routeClassifications } from '@/server/security/route-classification'
import { inventoryProblems, scanEntrypoints, type Classification } from './route-inventory'

const root = path.resolve('packages/web/src')
function sources(directory = root): Map<string, string> {
  const files = new Map<string, string>()
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) for (const [name, source] of sources(full)) files.set(name, source)
    else if (/\.[cm]?[jt]sx?$/.test(entry.name) && !/\.(test|spec|d)\./.test(entry.name))
      files.set(path.relative(root, full).split(path.sep).join('/'), readFileSync(full, 'utf8'))
  }
  return files
}
const guard = 'server/owner/session.ts#requireOwnerSession'
const guarded: Classification = {
  access: 'owner-session',
  guards: [[guard]],
  evidence: ['synthetic'],
  reason: 'synthetic rejection control',
}
const fixturePath = 'app/api/planted/route.ts'
const fixture = (source: string) => new Map([[fixturePath, source]])

describe('route and server-action authorization inventory', () => {
  it('classifies every discovered export and checks each handler against its reviewed guard and evidence', () => {
    const files = sources()
    expect(inventoryProblems(files, routeClassifications)).toEqual([])
    const entries = scanEntrypoints(files).entries
    expect(entries.some(({ method }) => method === 'ACTION')).toBe(true)
    expect(entries.some(({ id }) => id.startsWith('app/subscriptions/'))).toBe(true)
    for (const rule of Object.values(routeClassifications)) {
      for (const evidence of rule.evidence)
        expect(existsSync(path.resolve(evidence)), evidence).toBe(true)
    }
  })

  it('rejects a newly planted unguarded POST, even when someone classifies it', () => {
    const files = fixture('export async function POST() { return Response.json({ ok: true }) }')
    expect(inventoryProblems(files, {})).toContain(`${fixturePath}#POST: missing classification`)
    expect(inventoryProblems(files, { [`${fixturePath}#POST`]: guarded })).toContain(
      `${fixturePath}#POST: missing guard ${guard}`,
    )
    expect(
      inventoryProblems(files, {
        [`${fixturePath}#POST`]: { ...guarded, access: 'public-read', guards: [] },
      }),
    ).toContain(`${fixturePath}#POST: mutation has no recognized guard`)
  })

  it('does not borrow a sibling GET guard, comment, string, unused helper, or lookalike local guard', () => {
    for (const decoy of [
      '// requireOwnerSession(request.headers)',
      'const note = "requireOwnerSession(request.headers)"',
      'async function ignored() { await requireOwnerSession(request.headers) }',
      'const ignored = async () => requireOwnerSession(request.headers)',
    ]) {
      const files = fixture(`import { requireOwnerSession } from '@/server/owner/session'
export async function GET(request: Request) { await requireOwnerSession(request.headers); return Response.json({}) }
export async function POST(request: Request) { ${decoy}\n return Response.json({}) }`)
      expect(
        inventoryProblems(files, {
          [`${fixturePath}#GET`]: guarded,
          [`${fixturePath}#POST`]: guarded,
        }),
      ).toEqual([`${fixturePath}#POST: missing guard ${guard}`])
    }
    expect(
      inventoryProblems(
        fixture(
          'function requireOwnerSession() {}\nexport function POST() { requireOwnerSession(); return Response.json({}) }',
        ),
        { [`${fixturePath}#POST`]: guarded },
      ),
    ).toContain(`${fixturePath}#POST: missing guard ${guard}`)
  })

  it('follows aliased imports, local wrappers, arrow exports and HTTP export aliases', () => {
    const files = fixture(`import { requireOwnerSession as authorize } from '@/server/owner/session'
async function guardedRequest(request: Request) { await authorize(request.headers); return Response.json({}) }
const post = async (request: Request) => guardedRequest(request)
export { post as POST }
export const PATCH = async (request: Request) => guardedRequest(request)`)
    expect(
      inventoryProblems(files, {
        [`${fixturePath}#POST`]: guarded,
        [`${fixturePath}#PATCH`]: guarded,
      }),
    ).toEqual([])
  })

  it('finds module-level and inline server actions anywhere under src', () => {
    const files = new Map([
      [
        'reader/actions.ts',
        `'use server';\nexport async function save() {}\nconst remove = async () => {}; export { remove };`,
      ],
      [
        'app/page.tsx',
        'export default function Page() { async function save() { "use server"; } return null }',
      ],
    ])
    const { entries } = scanEntrypoints(files)
    expect(entries.map(({ id }) => id)).toEqual([
      'reader/actions.ts#save',
      'reader/actions.ts#remove',
      'app/page.tsx#inline@1:34',
    ])
    expect(inventoryProblems(files, {})).toHaveLength(3)
  })

  it('fails closed on an empty scan, empty route, unaudited re-export and stale classification', () => {
    expect(inventoryProblems(new Map(), {})).toContain('No route handlers or server actions found')
    expect(inventoryProblems(fixture('export const dynamic = "force-dynamic"'), {})).toContain(
      `${fixturePath}: no HTTP handlers found`,
    )
    expect(inventoryProblems(fixture('export * from "./hidden"'), {})).toContain(
      `${fixturePath}: wildcard/namespace exports are not auditable entrypoints`,
    )
    expect(inventoryProblems(fixture('export { POST } from "./hidden"'), {})).toContain(
      `${fixturePath}#POST: re-export requires a local reviewed handler`,
    )
    expect(inventoryProblems(new Map(), { stale: guarded })).toContain(
      'stale: stale classification',
    )
  })
})
