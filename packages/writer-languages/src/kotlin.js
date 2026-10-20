// SPDX-License-Identifier: AGPL-3.0-only

import { createRequire } from 'node:module'
import { relative } from 'node:path'
import Parser from 'tree-sitter'

const require = createRequire(import.meta.url)
const Kotlin = require('@tree-sitter-grammars/tree-sitter-kotlin')

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

function findChild(node, type) {
  return node.namedChildren.find((child) => child.type === type) ?? null
}

function visibilityOf(node) {
  const modifiers = findChild(node, 'modifiers')
  return (
    modifiers?.namedChildren.find((child) => child.type === 'visibility_modifier')?.text ??
    'public'
  )
}

function isExported(node) {
  const visibility = visibilityOf(node)
  return visibility !== 'private' && visibility !== 'protected' && visibility !== 'internal'
}

function summaryBefore(source, node) {
  const lines = source.split(/\r?\n/)
  let index = node.startPosition.row - 1
  const collected = []

  while (index >= 0) {
    const line = lines[index].trim()
    if (line === '') break
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

function addSymbol(symbols, symbol) {
  if (!symbol.name) return
  const duplicate = symbols.some(
    (current) => current.name === symbol.name && current.startOffset === symbol.startOffset
  )
  if (!duplicate) symbols.push(symbol)
}

function baseName(node) {
  if (!node) return null
  const text = normalize(node.text)
  if (!text) return null
  return text.split('.').pop().split('<')[0]
}

function addFunction(node, owner, symbols, source) {
  const nameNode = node.childForFieldName('name') ?? findChild(node, 'identifier')
  const name = nameNode?.text
  if (!name) return
  const body = findChild(node, 'function_body')
  const parameters = findChild(node, 'function_value_parameters')
  addSymbol(symbols, {
    name,
    kind: owner ? 'method' : 'function',
    exported: isExported(node),
    owner: owner ?? null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: `${name}${normalize(parameters?.text) || '()'}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function addConstructor(node, owner, symbols, source) {
  const parameters = findChild(node, 'function_value_parameters')
  const body = findChild(node, 'block')
  addSymbol(symbols, {
    name: 'constructor',
    kind: 'method',
    exported: isExported(node),
    owner,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: `constructor${normalize(parameters?.text) || '()'}`,
    nameOffset: node.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function addTypeAlias(node, symbols, source) {
  const nameNode =
    node.childForFieldName('type') ?? node.namedChildren.find((child) => child.type === 'identifier')
  const name = nameNode?.text
  if (!name) return
  addSymbol(symbols, {
    name,
    kind: 'type',
    exported: isExported(node),
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `typealias ${name}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })
}

function processDelegation(node, child, inheritance) {
  const specifiers = findChild(node, 'delegation_specifiers')
  for (const specifier of specifiers?.namedChildren ?? []) {
    const invocation = findChild(specifier, 'constructor_invocation')
    const typeNode = invocation ? findChild(invocation, 'user_type') : findChild(specifier, 'user_type')
    const parent = baseName(typeNode)
    if (!parent) continue
    inheritance.push({
      child,
      parent,
      line: lineOf(specifier),
      implements: false,
      confidence: 'inferred'
    })
  }
}

function processMembers(body, owner, symbols, inheritance, source) {
  if (!body) return
  for (const child of body.namedChildren) {
    if (child.type === 'function_declaration') {
      addFunction(child, owner, symbols, source)
    } else if (child.type === 'secondary_constructor') {
      addConstructor(child, owner, symbols, source)
    } else if (child.type === 'companion_object') {
      processMembers(findChild(child, 'class_body'), owner, symbols, inheritance, source)
    } else if (child.type === 'class_declaration' || child.type === 'object_declaration') {
      processType(child, symbols, inheritance, source)
    } else if (child.type === 'type_alias') {
      addTypeAlias(child, symbols, source)
    }
  }
}

function processType(node, symbols, inheritance, source) {
  const nameNode = node.childForFieldName('name') ?? findChild(node, 'identifier')
  const name = nameNode?.text
  if (!name) return

  if (node.type === 'object_declaration') {
    addSymbol(symbols, {
      name,
      kind: 'class',
      exported: isExported(node),
      owner: null,
      summary: summaryBefore(source, node),
      line: lineOf(node),
      endLine: endLineOf(node),
      signature: `object ${name}`,
      nameOffset: nameNode.startIndex,
      startOffset: node.startIndex,
      endOffset: node.endIndex
    })
    processDelegation(node, name, inheritance)
    processMembers(findChild(node, 'class_body'), name, symbols, inheritance, source)
    return
  }

  const head = normalize(node.text)
  const keyword = /\b(interface|enum)\b/.exec(head)?.[1] ?? 'class'
  const kind = keyword === 'interface' ? 'interface' : keyword === 'enum' ? 'enum' : 'class'
  addSymbol(symbols, {
    name,
    kind,
    exported: isExported(node),
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `${keyword} ${name}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })
  processDelegation(node, name, inheritance)
  const body =
    findChild(node, 'class_body') ?? findChild(node, 'enum_class_body')
  processMembers(body, name, symbols, inheritance, source)
}

function collectImports(root, imports, importedNames, namespaces) {
  for (const node of root.namedChildren) {
    if (node.type === 'package_header') {
      const name = normalize(node.namedChildren[0]?.text)
      if (name) namespaces.push(name)
      continue
    }
    if (node.type !== 'import') continue
    const target = node.namedChildren.find((child) => child.type === 'qualified_identifier')
    if (!target) continue
    const specifier = normalize(target.text)
    const wildcard = /\.\*$/.test(normalize(node.text))
    imports.push({
      specifier,
      kind: 'static',
      line: lineOf(node),
      confidence: 'extracted',
      wildcard
    })
    if (!wildcard) {
      const alias = node.namedChildren.find(
        (child) => child.type === 'identifier' && child !== target
      )?.text
      importedNames.add(alias ?? specifier.split('.').pop())
    }
  }
}

function callName(node) {
  if (!node) return null
  if (node.type === 'identifier') return node.text
  if (node.type === 'navigation_expression') return normalize(node.text).split('.').pop()
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
      .filter((symbol) => symbol.kind === 'function' || symbol.kind === 'method')
      .map((symbol) => symbol.name)
  )
  const calls = []
  const seen = new Set()

  walk(root, (node) => {
    if (node.type !== 'call_expression') return
    const functionNode =
      node.namedChildren.find(
        (child) => child.type === 'identifier' || child.type === 'navigation_expression'
      ) ?? null
    const callee = callName(functionNode)
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

function resolveKotlinImport({ specifier, fromFileAbs, rootAbs, namespaces }) {
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

export function createKotlinAdapter() {
  const parser = new Parser()
  parser.setLanguage(Kotlin)

  return {
    id: 'kotlin',
    extensions: ['.kt', '.kts'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const importedNames = new Set()
      const symbols = []
      const inheritance = []
      const namespaces = []

      collectImports(root, imports, importedNames, namespaces)
      for (const node of root.namedChildren) {
        if (node.type === 'class_declaration' || node.type === 'object_declaration') {
          processType(node, symbols, inheritance, source)
        } else if (node.type === 'function_declaration') {
          addFunction(node, null, symbols, source)
        } else if (node.type === 'type_alias') {
          addTypeAlias(node, symbols, source)
        }
      }
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
      return resolveKotlinImport(context)
    }
  }
}
