import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const sourceRoot = fileURLToPath(new URL('../../', import.meta.url))

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return sources(full)
    return /\.[cm]?[jt]sx?$/.test(entry.name) && !/\.(test|spec|d)\./.test(entry.name) ? [full] : []
  })
}

/**
 * Import confinement makes the transport unreachable from requests and publishing services.
 * Named health imports may read the console's probe only. Re-exports, dynamic imports, aliases
 * and type imports are scanned as well; adapters live behind the email boundary.
 */
function boundaryViolations(filename: string, source: string): string[] {
  const relative = path.relative(sourceRoot, filename).replaceAll(path.sep, '/')
  const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true)
  const violations: string[] = []
  function visit(node: ts.Node) {
    if (ts.isStringLiteralLike(node)) {
      const target = node.text.startsWith('@/')
        ? path.join(sourceRoot, node.text.slice(2))
        : node.text.startsWith('.')
          ? path.resolve(path.dirname(filename), node.text)
          : ''
      const emailRoot = path.join(sourceRoot, 'server/email')
      if (
        target === path.join(sourceRoot, 'server/outbox/handlers') &&
        relative !== 'server/outbox/dispatcher.ts'
      ) {
        violations.push(`${relative}: handler access outside dispatcher`)
      }
      if (target === emailRoot || target.startsWith(`${emailRoot}${path.sep}`)) {
        const allowed =
          relative.startsWith('server/email/') || relative === 'server/outbox/handlers.ts'
        const declaration = node.parent
        const bindings = ts.isImportDeclaration(declaration)
          ? declaration.importClause?.namedBindings
          : undefined
        const healthProbeOnly =
          relative === 'server/observability/runtime.ts' &&
          target === path.join(emailRoot, 'console') &&
          ts.isImportDeclaration(declaration) &&
          !declaration.importClause?.name &&
          bindings &&
          ts.isNamedImports(bindings) &&
          bindings.elements.length === 1 &&
          (bindings.elements[0]?.propertyName ?? bindings.elements[0]?.name)?.text ===
            'consoleEmailHealthProbe'
        if (!allowed && !healthProbeOnly)
          violations.push(`${relative}: email import outside dispatcher`)
      }
    }
    // Even within the email directory, sending belongs to the registered dispatcher handlers.
    if (
      relative.startsWith('server/email/') &&
      ts.isPropertyAccessExpression(node) &&
      node.name.text === 'send'
    ) {
      violations.push(`${relative}: sender access outside dispatcher`)
    }
    if (
      relative.startsWith('server/email/') &&
      ts.isElementAccessExpression(node) &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      node.argumentExpression.text === 'send'
    ) {
      violations.push(`${relative}: sender access outside dispatcher`)
    }
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  return violations
}

describe('email transport boundary', () => {
  it('confines the sender to the email adapters and dispatcher handlers across all application source', () => {
    const violations = sources(sourceRoot).flatMap((filename) =>
      boundaryViolations(filename, readFileSync(filename, 'utf8')),
    )
    expect(violations).toEqual([])
    const handler = readFileSync(path.join(sourceRoot, 'server/outbox/handlers.ts'), 'utf8')
    expect(handler).toContain('email.sender.send(')
  })

  it('detects request, domain, re-export and dynamic-import bypasses and rejects a sender imported by health', () => {
    for (const [filename, source] of [
      [
        'app/api/example/route.ts',
        "import { consoleEmailSender as sendMail } from '@/server/email/console'",
      ],
      ['server/content/service.ts', "import type { EmailSender } from '../email/ports'"],
      ['server/content/ports.ts', "export * from '../email/ports'"],
      ['server/content/service.ts', "const transport = import('../email/console')"],
      ['server/content/service.ts', "const transport = require('../email/console')"],
      [
        'app/api/example/route.ts',
        "import { createOutboxHandlers } from '@/server/outbox/handlers'",
      ],
      ['server/observability/runtime.ts', "import { consoleEmailSender } from '../email/console'"],
      ['server/email/helper.ts', 'sender.send(message, key)'],
      ['server/email/helper.ts', "sender['send'](message, key)"],
    ]) {
      expect(boundaryViolations(path.join(sourceRoot, filename!), source!)).not.toEqual([])
    }
  })
})
