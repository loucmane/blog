import path from 'node:path'
import ts from 'typescript'

export interface Classification {
  readonly access: string
  /** Every group must have at least one recognized imported call in the handler's local call graph. */
  readonly guards: readonly (readonly string[])[]
  readonly evidence: readonly string[]
  readonly reason: string
}

interface Entry {
  readonly id: string
  readonly method: string
  readonly calls: ReadonlySet<string>
}

const httpMethods = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
const exported = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
const directive = (statements: ts.NodeArray<ts.Statement>) =>
  statements.some(
    (node) =>
      ts.isExpressionStatement(node) &&
      ts.isStringLiteral(node.expression) &&
      node.expression.text === 'use server',
  )

/** Parse exports, not text matches: comments, type exports and unrelated sibling handlers do not count. */
export function scanEntrypoints(files: ReadonlyMap<string, string>) {
  const entries: Entry[] = []
  const problems: string[] = []
  for (const [file, source] of files) {
    const tree = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )
    const route = /^app\/(?:.*\/)?route\.[cm]?[jt]sx?$/.test(file)
    const server = directive(tree.statements)
    const locals = new Map<string, ts.Node>()
    const imports = new Map<string, string>()
    const resolve = (specifier: string) =>
      specifier.startsWith('@/')
        ? `${specifier.slice(2)}.ts`
        : specifier.startsWith('.')
          ? `${path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier))}.ts`
          : specifier
    for (const node of tree.statements) {
      if (ts.isFunctionDeclaration(node) && node.name) locals.set(node.name.text, node)
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.initializer)
            locals.set(declaration.name.text, declaration.initializer)
        }
      }
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        !node.importClause?.isTypeOnly
      ) {
        const bindings = node.importClause?.namedBindings
        if (bindings && ts.isNamedImports(bindings)) {
          for (const binding of bindings.elements) {
            if (!binding.isTypeOnly)
              imports.set(
                binding.name.text,
                `${resolve(node.moduleSpecifier.text)}#${(binding.propertyName ?? binding.name).text}`,
              )
          }
        }
        if (bindings && ts.isNamespaceImport(bindings))
          imports.set(bindings.name.text, `${resolve(node.moduleSpecifier.text)}#`)
      }
    }

    function callsFrom(root: ts.Node): Set<string> {
      const calls = new Set<string>()
      const visited = new Set<ts.Node>()
      function walk(node: ts.Node, entry = false) {
        if (visited.has(node)) return
        visited.add(node)
        if (
          !entry &&
          (ts.isFunctionDeclaration(node) ||
            ts.isArrowFunction(node) ||
            ts.isFunctionExpression(node))
        ) {
          // Only invoked locals and callbacks passed to a call are reachable, not unused helpers.
          if (
            !ts.isCallExpression(node.parent) ||
            !node.parent.arguments.includes(node as ts.Expression)
          )
            return
        }
        if (ts.isCallExpression(node)) {
          const callee = node.expression
          if (ts.isIdentifier(callee)) {
            const imported = imports.get(callee.text)
            if (imported) calls.add(imported)
            const local = locals.get(callee.text)
            if (local) walk(local, true)
          } else if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)) {
            const imported = imports.get(callee.expression.text)
            if (imported?.endsWith('#')) calls.add(`${imported}${callee.name.text}`)
          }
        }
        ts.forEachChild(node, (child) => walk(child))
      }
      walk(root, true)
      return calls
    }

    const add = (name: string, node: ts.Node, method = name) => {
      const id = `${file}#${name}`
      if (entries.some((entry) => entry.id === id)) problems.push(`${id}: duplicate entrypoint`)
      entries.push({ id, method, calls: callsFrom(node) })
    }
    const include = (name: string) => server || (route && httpMethods.has(name))
    for (const node of tree.statements) {
      if (exported(node) && ts.isFunctionDeclaration(node)) {
        const name = ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
          ? 'default'
          : node.name?.text
        if (name && include(name)) add(name, node, server ? 'ACTION' : name)
      }
      if (exported(node) && ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) {
            if (include(declaration.name.text))
              add(
                declaration.name.text,
                declaration.initializer ?? declaration,
                server ? 'ACTION' : declaration.name.text,
              )
          } else if (route || server) {
            problems.push(`${file}: destructured export requires an explicit named handler`)
          }
        }
      }
      if (ts.isExportDeclaration(node) && !node.isTypeOnly && (route || server)) {
        if (!node.exportClause || !ts.isNamedExports(node.exportClause)) {
          problems.push(`${file}: wildcard/namespace exports are not auditable entrypoints`)
        } else {
          for (const binding of node.exportClause.elements) {
            if (binding.isTypeOnly || !include(binding.name.text)) continue
            const local = locals.get((binding.propertyName ?? binding.name).text)
            if (node.moduleSpecifier || !local)
              problems.push(
                `${file}#${binding.name.text}: re-export requires a local reviewed handler`,
              )
            add(binding.name.text, local ?? binding, server ? 'ACTION' : binding.name.text)
          }
        }
      }
      if (ts.isExportAssignment(node) && server) add('default', node.expression, 'ACTION')
    }

    function inline(node: ts.Node) {
      if (
        (ts.isFunctionDeclaration(node) ||
          ts.isArrowFunction(node) ||
          ts.isFunctionExpression(node) ||
          ts.isMethodDeclaration(node)) &&
        node.body &&
        ts.isBlock(node.body) &&
        directive(node.body.statements)
      ) {
        const position = tree.getLineAndCharacterOfPosition(node.getStart(tree))
        add(`inline@${position.line + 1}:${position.character + 1}`, node, 'ACTION')
      }
      ts.forEachChild(node, inline)
    }
    if (!server) inline(tree)
    if (route && !entries.some((entry) => entry.id.startsWith(`${file}#`)))
      problems.push(`${file}: no HTTP handlers found`)
  }
  if (entries.length === 0) problems.push('No route handlers or server actions found')
  return { entries, problems }
}

export function inventoryProblems(
  files: ReadonlyMap<string, string>,
  classifications: Readonly<Record<string, Classification>>,
) {
  const { entries, problems } = scanEntrypoints(files)
  for (const entry of entries) {
    const rule = classifications[entry.id]
    if (!rule) {
      problems.push(`${entry.id}: missing classification`)
      continue
    }
    if (!rule.reason || rule.evidence.length === 0)
      problems.push(`${entry.id}: missing review evidence`)
    if (!['GET', 'HEAD'].includes(entry.method) && rule.guards.length === 0)
      problems.push(`${entry.id}: mutation has no recognized guard`)
    for (const alternatives of rule.guards) {
      if (!alternatives.some((guard) => entry.calls.has(guard)))
        problems.push(`${entry.id}: missing guard ${alternatives.join(' or ')}`)
    }
  }
  for (const id of Object.keys(classifications)) {
    if (!entries.some((entry) => entry.id === id)) problems.push(`${id}: stale classification`)
  }
  return problems
}
