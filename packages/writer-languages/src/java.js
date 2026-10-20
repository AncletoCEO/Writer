// SPDX-License-Identifier: AGPL-3.0-only

import { createRequire } from 'node:module'
import { relative } from 'node:path'
import Parser from 'tree-sitter'

const require = createRequire(import.meta.url)
const Java = require('tree-sitter-java')

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
  const modifiers = node.namedChildren.find((child) => child.type === 'modifiers')
  return Boolean(modifiers && /\bpublic\b/.test(modifiers.text))
}

function summaryBefore(source, node) {
  const lines = source.split(/\r?\n/)
  let index = node.startPosition.row - 1
  const collected = []

  while (index >= 0) {
    const line = lines[index].trim()
    if (line === '') break
    if (line.startsWith('@')) {
      index -= 1
      continue
    }
    if (line.endsWith('*/')) {
      let start = index
      while (start >= 0 && !lines[start].includes('/*')) start -= 1
      if (start < 0) break
      const block = lines
        .slice(start, index + 1)
        .join('\n')
        .replace(/^\s*\/\*+!?/, '')
        .replace(/\*\/\s*$/, '')
        .split(/\r?\n/)
        .map((entry) => entry.trim().replace(/^\*\s?/, ''))
      collected.unshift(...block)
      index = start - 1
      break
    }
    if (line.startsWith('//')) {
      collected.unshift(line.replace(/^\/\/\s?/, ''))
      index -= 1
      continue
    }
    break
  }

  return (
    collected
      .map((entry) => entry.trim())
      .find((entry) => entry && !entry.startsWith('@')) ?? null
  )
}

function baseName(node) {
  if (!node) return null
  if (node.type === 'type_identifier' || node.type === 'scoped_type_identifier') {
    return normalize(node.text)
  }
  if (node.type === 'generic_type') return baseName(node.namedChildren[0])
  return null
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

function findChild(node, type) {
  return node.namedChildren.find((child) => child.type === type) ?? null
}

function processMethod(node, owner, symbols, source, { isInterface = false } = {}) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const body = node.childForFieldName('body') ?? findChild(node, 'constructor_body')
  addSymbol(symbols, {
    name,
    kind: 'method',
    exported: isInterface || hasPublicModifier(node),
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

function processMembers(body, owner, symbols, inheritance, source, options = {}) {
  if (!body) return
  for (const child of body.namedChildren) {
    if (child.type === 'method_declaration' || child.type === 'constructor_declaration') {
      processMethod(child, owner, symbols, source, options)
    } else if (
      child.type === 'class_declaration' ||
      child.type === 'interface_declaration' ||
      child.type === 'enum_declaration' ||
      child.type === 'record_declaration' ||
      child.type === 'annotation_type_declaration'
    ) {
      processType(child, symbols, inheritance, source)
    }
  }
}

function processType(node, symbols, inheritance, source) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const exported = hasPublicModifier(node)
  const kind =
    node.type === 'interface_declaration' ||
    node.type === 'annotation_type_declaration'
      ? 'interface'
      : node.type === 'enum_declaration'
        ? 'enum'
        : 'class'
  const prefix =
    node.type === 'interface_declaration'
      ? 'interface'
      : node.type === 'annotation_type_declaration'
        ? '@interface'
        : node.type === 'enum_declaration'
          ? 'enum'
          : node.type === 'record_declaration'
            ? 'record'
            : 'class'

  addSymbol(symbols, {
    name,
    kind,
    exported,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `${prefix} ${name}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })

  const superclass = findChild(node, 'superclass')
  if (superclass) {
    const parent = baseName(superclass.namedChildren[0])
    if (parent) {
      inheritance.push({
        child: name,
        parent,
        line: lineOf(superclass),
        implements: false,
        confidence: 'inferred'
      })
    }
  }

  for (const type of ['super_interfaces', 'extends_interfaces']) {
    const listNode = findChild(node, type)
    const typeList = listNode ? findChild(listNode, 'type_list') : null
    for (const entry of typeList?.namedChildren ?? []) {
      const parent = baseName(entry)
      if (!parent) continue
      inheritance.push({
        child: name,
        parent,
        line: lineOf(entry),
        implements: true,
        confidence: 'inferred'
      })
    }
  }

  const body =
    findChild(node, 'class_body') ??
    findChild(node, 'interface_body') ??
    findChild(node, 'enum_body') ??
    findChild(node, 'annotation_type_body')
  processMembers(body, name, symbols, inheritance, source, {
    isInterface: kind === 'interface'
  })
}

function collectItems(container, symbols, inheritance, source) {
  for (const node of container.namedChildren) {
    if (
      node.type === 'class_declaration' ||
      node.type === 'interface_declaration' ||
      node.type === 'enum_declaration' ||
      node.type === 'record_declaration' ||
      node.type === 'annotation_type_declaration'
    ) {
      processType(node, symbols, inheritance, source)
    }
  }
}

function collectImports(root, imports, importedNames) {
  for (const node of root.namedChildren) {
    if (node.type !== 'import_declaration') continue
    const target = node.namedChildren.find(
      (child) => child.type === 'scoped_identifier' || child.type === 'identifier'
    )
    if (!target) continue
    const specifier = normalize(target.text)
    imports.push({
      specifier,
      kind: 'static',
      line: lineOf(node),
      confidence: 'extracted'
    })
    const wildcard = node.namedChildren.some((child) => child.type === 'asterisk')
    if (!wildcard) {
      const bound = specifier.split('.').pop()
      if (bound) importedNames.add(bound)
    }
  }
}

function callName(node) {
  const name = node.childForFieldName('name')
  if (name) return name.text
  const identifier = node.namedChildren.find((child) => child.type === 'identifier')
  return identifier?.text ?? null
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
      .filter((symbol) => symbol.kind === 'method')
      .map((symbol) => symbol.name)
  )
  const calls = []
  const seen = new Set()

  walk(root, (node) => {
    if (node.type !== 'method_invocation') return
    const callee = callName(node)
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

function resolveJavaImport({ specifier, fromFileAbs, rootAbs, namespaces }) {
  if (typeof specifier !== 'string' || specifier.trim() === '') {
    return { type: 'unresolved', reason: 'not-found' }
  }

  const parts = specifier.trim().split('.').filter(Boolean)
  const from = toPosix(relative(rootAbs, fromFileAbs))

  for (let end = parts.length; end >= 1; end -= 1) {
    const key = parts.slice(0, end).join('.')
    const targets = namespaces?.get(key)
    if (!targets || targets.length === 0) continue
    const filtered = targets.filter((target) => target !== from)
    if (filtered.length === 0) return { type: 'external' }
    return { type: 'resolved', targets: filtered }
  }

  return { type: 'external' }
}

export function createJavaAdapter() {
  const parser = new Parser()
  parser.setLanguage(Java)

  return {
    id: 'java',
    extensions: ['.java'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const importedNames = new Set()
      const symbols = []
      const inheritance = []
      const namespaces = []

      const packageNode = root.namedChildren.find((node) => node.type === 'package_declaration')
      const packageName = packageNode?.namedChildren[0]?.text
      if (packageName) namespaces.push(normalize(packageName))

      collectImports(root, imports, importedNames)
      collectItems(root, symbols, inheritance, source)
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
        namespaces
      }
    },

    resolveImport(context) {
      return resolveJavaImport(context)
    }
  }
}
