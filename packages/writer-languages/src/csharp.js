// SPDX-License-Identifier: AGPL-3.0-only

import { createRequire } from 'node:module'
import { dirname, relative } from 'node:path'
import Parser from 'tree-sitter'

const require = createRequire(import.meta.url)
const grammarPackage = require.resolve('tree-sitter-c-sharp/package.json')
const grammarRequire = createRequire(grammarPackage)
const CSharp = grammarRequire('node-gyp-build')(dirname(grammarPackage))

function toPosix(path) {
  return String(path).split('\\').join('/')
}

function normalize(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

function lineOf(node) {
  return node.startPosition.row + 1
}

function endLineOf(node) {
  return node.endPosition.row + 1
}

function walk(node, visit) {
  visit(node)
  for (const child of node.namedChildren) walk(child, visit)
}

function hasPublicModifier(node) {
  return node.namedChildren.some(
    (child) => child.type === 'modifier' && child.text === 'public'
  )
}

function summaryBefore(source, node) {
  const lines = source.split(/\r?\n/)
  let index = node.startPosition.row - 1
  const collected = []

  while (index >= 0) {
    const line = lines[index].trim()
    if (line === '') break
    if (line.startsWith('///')) {
      collected.unshift(line.replace(/^\/\/\/\s?/, '').trim())
      index -= 1
      continue
    }
    if (line.startsWith('[') || line.endsWith(']')) {
      index -= 1
      continue
    }
    break
  }

  const text = collected
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text || null
}

function baseName(node) {
  if (!node) return null
  const text = normalize(node.text)
  if (!text) return null
  return text.split('<')[0]
}

function methodSignature(node, name) {
  return `${name}${normalize(node.childForFieldName('parameters')?.text) || '()'}`
}

function addSymbol(symbols, symbol) {
  if (!symbol.name) return
  const duplicate = symbols.some(
    (current) => current.name === symbol.name && current.startOffset === symbol.startOffset
  )
  if (!duplicate) symbols.push(symbol)
}

function processMethod(node, owner, ownerExported, symbols, source, { isInterface = false } = {}) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const body = node.childForFieldName('body')
  addSymbol(symbols, {
    name,
    kind: 'method',
    exported: isInterface ? ownerExported : hasPublicModifier(node),
    owner,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: methodSignature(node, name),
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function processMembers(body, owner, ownerExported, symbols, inheritance, source, options = {}) {
  if (!body) return
  for (const child of body.namedChildren) {
    if (child.type === 'method_declaration' || child.type === 'constructor_declaration') {
      processMethod(child, owner, ownerExported, symbols, source, options)
    } else {
      processItem(child, symbols, inheritance, source)
    }
  }
}

function processType(node, symbols, inheritance, source) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const exported = hasPublicModifier(node)
  const kind =
    node.type === 'interface_declaration'
      ? 'interface'
      : node.type === 'enum_declaration'
        ? 'enum'
        : node.type === 'delegate_declaration'
          ? 'type'
          : 'class'
  const prefix =
    node.type === 'struct_declaration'
      ? 'struct'
      : node.type === 'record_declaration'
        ? 'record'
        : node.type === 'interface_declaration'
          ? 'interface'
          : node.type === 'enum_declaration'
            ? 'enum'
            : node.type === 'delegate_declaration'
              ? 'delegate'
              : 'class'
  const signature =
    node.type === 'delegate_declaration'
      ? `delegate ${name}${normalize(node.childForFieldName('parameters')?.text) || '()'}`
      : `${prefix} ${name}`

  addSymbol(symbols, {
    name,
    kind,
    exported,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })

  const baseList =
    node.childForFieldName('base_list') ??
    node.namedChildren.find((child) => child.type === 'base_list')
  for (const base of baseList?.namedChildren ?? []) {
    const parent = baseName(base)
    if (!parent) continue
    inheritance.push({
      child: name,
      parent,
      line: lineOf(base),
      implements: false,
      confidence: 'inferred'
    })
  }

  if (node.type === 'enum_declaration' || node.type === 'delegate_declaration') return
  processMembers(
    node.childForFieldName('body'),
    name,
    exported,
    symbols,
    inheritance,
    source,
    { isInterface: node.type === 'interface_declaration' }
  )
}

function processItem(node, symbols, inheritance, source) {
  if (
    node.type === 'class_declaration' ||
    node.type === 'interface_declaration' ||
    node.type === 'struct_declaration' ||
    node.type === 'record_declaration' ||
    node.type === 'enum_declaration' ||
    node.type === 'delegate_declaration'
  ) {
    processType(node, symbols, inheritance, source)
  }
}

function addNamespace(namespaces, name) {
  if (name && !namespaces.includes(name)) namespaces.push(name)
}

function collectContainer(container, prefix, namespaces, symbols, inheritance, source) {
  let current = prefix

  for (const node of container.namedChildren) {
    if (node.type === 'file_scoped_namespace_declaration') {
      const name = normalize(node.childForFieldName('name')?.text)
      current = prefix ? `${prefix}.${name}` : name
      addNamespace(namespaces, current)
      continue
    }

    if (node.type === 'namespace_declaration') {
      const name = normalize(node.childForFieldName('name')?.text)
      const full = prefix ? `${prefix}.${name}` : name
      addNamespace(namespaces, full)
      const body = node.childForFieldName('body')
      if (body) collectContainer(body, full, namespaces, symbols, inheritance, source)
      continue
    }

    processItem(node, symbols, inheritance, source)
  }
}

function collectImports(root, imports, importedNames) {
  walk(root, (node) => {
    if (node.type !== 'using_directive') return
    const children = node.namedChildren
    if (children.length === 0) return

    let alias = null
    let target = null
    if (children.length >= 2 && children[0].type === 'identifier') {
      alias = children[0].text
      target = children[children.length - 1].text
    } else {
      target = children[children.length - 1].text
    }
    if (!target) return

    imports.push({
      specifier: normalize(target),
      kind: 'static',
      line: lineOf(node),
      confidence: 'extracted'
    })
    const bound = alias ?? normalize(target).split('.').pop()
    if (bound && bound !== '_') importedNames.add(bound)
  })
}

function callName(fn) {
  if (!fn) return null
  if (fn.type === 'identifier') return fn.text
  if (fn.type === 'member_access_expression') {
    return fn.childForFieldName('name')?.text ?? normalize(fn.text).split('.').pop()
  }
  if (fn.type === 'generic_name') return normalize(fn.text).split('<')[0]
  if (fn.type === 'member_binding_expression') {
    return normalize(fn.text).split('.').pop()
  }
  return null
}

function findCaller(symbols, start, end) {
  let best = null
  for (const symbol of symbols) {
    if (symbol.startOffset > start || symbol.endOffset < end) continue
    if (!best || symbol.endOffset - symbol.startOffset < best.endOffset - best.startOffset) {
      best = symbol
    }
  }
  return best
}

function collectCalls(root, symbols) {
  const localNames = new Set(
    symbols
      .filter((symbol) => symbol.kind === 'method' || symbol.kind === 'function')
      .map((symbol) => symbol.name)
  )
  const calls = []
  const seen = new Set()

  walk(root, (node) => {
    if (node.type !== 'invocation_expression') return
    const callee = callName(node.childForFieldName('function'))
    if (!callee || !localNames.has(callee)) return
    const caller = findCaller(symbols, node.startIndex, node.endIndex)
    const line = lineOf(node)
    const key = `${caller?.name ?? ''}|${callee}|${line}`
    if (seen.has(key)) return
    seen.add(key)
    calls.push({
      caller: caller?.name ?? null,
      callerLine: caller?.line ?? null,
      callee,
      line,
      confidence: 'inferred'
    })
  })

  calls.sort((a, b) => a.line - b.line || a.callee.localeCompare(b.callee))
  return calls
}

function resolveCSharpImport({ specifier, fromFileAbs, rootAbs, namespaces }) {
  if (typeof specifier !== 'string' || specifier.trim() === '') {
    return { type: 'unresolved', reason: 'not-found' }
  }

  const targets = namespaces?.get(specifier.trim())
  if (!targets || targets.length === 0) return { type: 'external' }

  const from = toPosix(relative(rootAbs, fromFileAbs))
  const filtered = targets.filter((target) => target !== from)
  if (filtered.length === 0) return { type: 'external' }

  return { type: 'resolved', targets: filtered }
}

export function createCSharpAdapter() {
  const parser = new Parser()
  parser.setLanguage(CSharp)

  return {
    id: 'csharp',
    extensions: ['.cs'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const importedNames = new Set()
      const symbols = []
      const inheritance = []
      const namespaces = []

      collectImports(root, imports, importedNames)
      collectContainer(root, '', namespaces, symbols, inheritance, source)
      symbols.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name))
      const calls = collectCalls(root, symbols)

      return {
        path,
        lang,
        imports,
        unresolved: [],
        symbols,
        calls,
        inheritance,
        importedNames: [...importedNames].sort(),
        namespaces: [...namespaces].sort()
      }
    },

    resolveImport(context) {
      return resolveCSharpImport(context)
    }
  }
}
